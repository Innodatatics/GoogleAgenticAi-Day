from flask import Flask, request, jsonify, render_template, json, redirect, url_for
from flask_cors import CORS
from firebase_admin import credentials, firestore, initialize_app, storage
from modules.issues import get_issues, update_issue, resolve_issue, get_user_rating
from modules.notifications import notify_all, get_notifications
from modules.map_utils import compute_turnaround_time
from modules.bhuvan import get_alternate_route
from datetime import datetime, timezone
import logging
import smtplib
import uuid
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)


issues = []


# Initialize Firebase with "google" database
try:
    cred = credentials.Certificate(r"C:\Users\Ram\Downloads\Google_Agentic_AI-2025\Google_Agentic_AI\fluted-equinox-466506-r5-firebase-adminsdk-fbsvc-6976ac1e3b.json")
    initialize_app(cred, {
        'storageBucket': 'fluted-equinox-466506-r5.firebasestorage.app', 
        'databaseURL': 'https://fluted-equinox-466506-r5.google.firebaseio.com'
    })
    db = firestore.client()
    bucket = storage.bucket()
except Exception as e:
    logger.error(f"Error initializing Firebase: {e}")
    exit(1)

# Email configuration (update with your SMTP details)
EMAIL_SENDER = "isronasaesa@gmail.com"
EMAIL_PASSWORD = "mbtz admz ifym kftb"  # Use Gmail App Password
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587

def send_email(to_email, report):
    try:
        msg = MIMEMultipart()
        msg['From'] = EMAIL_SENDER
        msg['To'] = to_email
        msg['Subject'] = f"New Report Created - ID: {report['report_id']}"
        
        body = f"""
        New Report Created:
        ID: {report['report_id']}
        Issue Type: {report['issue_type']}
        Description: {report['description']}
        Location: {report['location']}
        Duration: {report['duration']}
        Traffic Flow Affected: {report['traffic_flow']}
        Causing Harm: {report['causing_harm']}
        Timestamp: {report['timestamp']}
        Proofs: {', '.join(report.get('proofs', [])) or 'None'}
        """
        msg.attach(MIMEText(body, 'plain'))
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)
        logger.info(f"Email sent to {to_email}")
    except Exception as e:
        logger.error(f"Error sending email to {to_email}: {e}")

def update_user_contributions(email, report_id):
    try:
        contrib_ref = db.collection('user_contributions').document(email)
        contrib_doc = contrib_ref.get()
        if contrib_doc.exists:
            contrib_data = contrib_doc.to_dict()
            contrib_data['report_count'] = contrib_data.get('report_count', 0) + 1
            contrib_data['report_ids'] = contrib_data.get('report_ids', []) + [report_id]
        else:
            contrib_data = {
                'email': email,
                'report_count': 1,
                'report_ids': [report_id],
                'last_updated': datetime.now(timezone.utc).isoformat()
            }
        contrib_ref.set(contrib_data)
        logger.info(f"Updated contributions for {email}: {contrib_data}")
    except Exception as e:
        logger.error(f"Error updating contributions for {email}: {e}")


@app.route('/')
def dashboard():
    try:
        issues_ref = db.collection('issues').stream()
        issues = []
        for doc in issues_ref:
            issue = doc.to_dict() | {'id': doc.id}
            
            # Parse lat/lon from 'location' if available and valid
            location = issue.get('location')
            if location and isinstance(location, list) and len(location) == 2:
                try:
                    issue['latitude'] = float(location[0])
                    issue['longitude'] = float(location[1])
                except (ValueError, TypeError):
                    issue['latitude'] = None
                    issue['longitude'] = None
                    logger.warning(f"Issue {doc.id} has invalid coordinates: {location}")
            else:
                issue['latitude'] = None
                issue['longitude'] = None
                logger.warning(f"Issue {doc.id} missing location data")

            issues.append(issue)

        return render_template('dashboard.html', issues=issues)
    except Exception as e:
        logger.error(f"Error loading dashboard issues: {e}")
        return render_template('dashboard.html', issues=[])


@app.route('/test_firestore', methods=['GET'])
def test_firestore():
    try:
        db.collection('test').document('test').set({'test': 'ok'})
        return jsonify({"message": "Firestore accessible"}), 200
    except Exception as e:
        logger.error(f"Error testing Firestore: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/create_user', methods=['POST'])
def route_create_user():
    data = request.json
    required_fields = ['name', 'email', 'phone']
    if not all(field in data for field in required_fields):
        logger.error(f"Missing fields in create_user: {data}")
        return jsonify({"error": "Missing required fields"}), 400
    user_data = {
        'name': data['name'],
        'phone': data['phone'],
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    try:
        db.collection('users').document(data['email']).set(user_data)
        return jsonify({"message": "User created", "email": data['email']}), 201
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/get_user', methods=['GET'])
def route_get_user():
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Email required"}), 400
    try:
        user_doc = db.collection('users').document(email).get()
        contrib_doc = db.collection('user_contributions').document(email).get()
        user_data = user_doc.to_dict() if user_doc.exists else {}
        contrib_data = contrib_doc.to_dict() if contrib_doc.exists else {}
        return jsonify({"user": user_data, "contributions": contrib_data}), 200
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/create_issue', methods=['GET', 'POST'])
def create_issue():
    if request.method == 'POST':
        data = request.get_json()
        required_fields = ['name', 'email', 'issue_type', 'description', 'location', 'duration', 'traffic_flow', 'causing_harm']
        if not all(field in data for field in required_fields):
            logger.error(f"Missing fields in create_issue: {data}")
            return jsonify({"error": "Missing required fields"}), 400

        issue_id = str(uuid.uuid4())[:8]
        report = {
            'id': issue_id,
            'creator_email': data['email'],
            'issue_type': data['issue_type'],
            'description': data['description'],
            'location': data['location'],
            'duration': data['duration'],
            'traffic_flow': data['traffic_flow'],
            'causing_harm': data['causing_harm'],
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'name': data['name'],
            'phone': data['phone'],
            'proofs': data.get('proofs', []),
            'processed': False,
            'points': 5
        }

        try:
            doc_ref = db.collection('reports').add(report)
            report_id = doc_ref[1].id
            report['report_id'] = report_id

            # Notify others
            notify_all(db, {
                "type": "new_report",
                "timestamp": report['timestamp'],
                "report_id": report_id,
                "location": report['location'],
                "description": report['description'],
                "issue_type": report['issue_type'],
                "duration": report['duration'],
                "traffic_flow": report['traffic_flow'],
                "causing_harm": report['causing_harm']
            })
            issues.append(report)
            update_user_contributions(data['email'], report_id)

            send_email(data['email'], report)

            logger.info(f"Issue created and stored: {report_id}")
            return jsonify({'id': report_id, 'message': 'Issue created successfully'}), 201

        except Exception as e:
            logger.error(f"Error creating issue: {e}")
            return jsonify({"error": str(e)}), 500

    else:
        return render_template("create_issue.html")
    

@app.route('/upload_proof', methods=['POST'])
def route_upload_proof():
    logger.debug(f"Received upload_proof request: files={request.files}, form={request.form}")
    if 'proof' not in request.files:
        logger.error("No file provided in upload_proof")
        return jsonify({"error": "No file provided"}), 400
    file = request.files['proof']
    report_id = request.form.get('report_id')
    if not report_id:
        logger.error("Report ID missing in upload_proof")
        return jsonify({"error": "Report ID required"}), 400
    if not db.collection('reports').document(report_id).get().exists:
        logger.error(f"Report ID {report_id} not found")
        return jsonify({"error": "Report ID not found"}), 404
    if file and file.filename:
        if file.content_length > 10 * 1024 * 1024:  # 10 MB limit
            logger.error(f"File too large: {file.content_length} bytes")
            return jsonify({"error": "File too large, max 10MB"}), 400
        allowed_types = ['image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg']
        if file.content_type not in allowed_types:
            logger.error(f"Invalid file type: {file.content_type}")
            return jsonify({"error": "Invalid file type"}), 400
        filename = f"proofs/{report_id}/{file.filename}"
        logger.debug(f"Uploading file to: {filename}")
        try:
            blob = bucket.blob(filename)
            blob.upload_from_file(file, content_type=file.content_type)
            blob.make_public()
            file_url = blob.public_url
            db.collection('reports').document(report_id).update({
                'proofs': firestore.ArrayUnion([file_url])
            })
            report = db.collection('reports').document(report_id).get().to_dict()
            report['report_id'] = report_id
            send_email(report['creator_email'], report)
            logger.info(f"File uploaded: {file_url} for report {report_id}")
            return jsonify({"message": "File uploaded", "url": file_url}), 200
        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            return jsonify({"error": str(e)}), 500
    logger.error("No file content provided")
    return jsonify({"error": "File upload failed"}), 400


@app.route('/get_issues', methods=['GET'])
def route_get_issues():
    role = request.args.get('role', 'user')
    email = request.args.get('email', None)
    solved = request.args.get('is_solved')
    try:
        result = get_issues(db, role, email, solved)
        for issue in result:
            compute_turnaround_time(issue)
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error getting issues: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/get_user_rating', methods=['GET'])
def route_get_user_rating():
    email = request.args.get('email')
    if not email:
        return jsonify({"error": "Email required"}), 400
    try:
        rating = get_user_rating(db, email)
        return jsonify({"rating": rating}), 200
    except Exception as e:
        logger.error(f"Error getting user rating: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/resolve_issue/<id>', methods=['POST'])
def route_resolve_issue(id):
    data = request.json
    try:
        resolve_issue(db, id, data)
        return jsonify({'message': "Issue marked as solved"}), 200
    except Exception as e:
        logger.error(f"Error resolving issue: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/update_issue/<id>', methods=['POST'])
def route_update_issue(id):
    data = request.json
    try:
        update_issue(db, id, data)
        return jsonify({"message": "Issue updated"}), 200
    except Exception as e:
        logger.error(f"Error updating issue: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/notifications', methods=['GET'])
def route_get_notifications():
    try:
        return jsonify(get_notifications(db)), 200
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/alternate_route', methods=['POST'])
def route_alternate_route():
    data = request.json
    try:
        return jsonify(get_alternate_route(data['from'], data['to'])), 200
    except Exception as e:
        logger.error(f"Error getting alternate route: {e}")
        return jsonify({"error": str(e)}), 500
    

@app.route('/create_issue_form', methods=['GET'])
def show_create_issue_form():
    return render_template('create_issue.html')


@app.route('/issues')
@app.route('/current_issues')
def current_issues():
    try:
        issues_ref = db.collection('issues').stream()
        issues = [doc.to_dict() | {'id': doc.id} for doc in issues_ref]
        return render_template('current_issues.html', issues=issues)
    except Exception as e:
        logger.error(f"Error loading current issues: {e}")
        return render_template('current_issues.html', issues=[])



def find_issue_by_id(issue_id):
    for issue in issues:
        if issue['id'] == issue_id:
            return issue
    return None


@app.route('/issue/<issue_id>')
def view_issue(issue_id):
    try:
        doc = db.collection('issues').document(issue_id).get()
        if not doc.exists:
            return "Issue not found", 404
        issue = doc.to_dict() | {'id': doc.id}
        return render_template('partials/issue_detail.html', issue=issue)
    except Exception as e:
        logger.error(f"Error loading issue {issue_id}: {e}")
        return "Error loading issue", 500


@app.route("/search")
def search():
    try:
        issues_ref = db.collection('issues').stream()
        issues = [doc.to_dict() | {'id': doc.id} for doc in issues_ref]
        return render_template("search.html", issues=issues)
    except Exception as e:
        logger.error(f"Error loading search page: {e}")
        return render_template("search.html", issues=[])


@app.route("/social_insights")
def social_insights():
    try:
        news_ref = db.collection("classified_news").stream()

        insights = []
        category_counts = {}

        for doc in news_ref:
            data = doc.to_dict()

            classification = data.get("classification", "Unknown")
            category = classification.split(":")[1].strip().split()[0] if ":" in classification else "Unknown"
            category_counts[category] = category_counts.get(category, 0) + 1

            insights.append({
                "city": data.get("city", "Unknown"),
                "classification": classification,
                "timestamp": data.get("timestamp", "N/A"),
                "url": data.get("url", "#")
            })

        return render_template("social_insights.html", insights=insights, category_counts=category_counts)

    except Exception as e:
        logger.error(f"Error loading social insights: {e}")
        return "Error loading insights", 500
    

def get_all_issues():
    try:
        issues_ref = db.collection('issues').stream()
        issues = []
        for doc in issues_ref:
            issue = doc.to_dict()
            issue['id'] = doc.id
            loc = issue.get('location')
            if loc and isinstance(loc, list) and len(loc) == 2:
                issue['latitude'] = float(loc[0])
                issue['longitude'] = float(loc[1])
            else:
                issue['latitude'] = None
                issue['longitude'] = None
            issues.append(issue)
        return issues
    except Exception as e:
        logger.error(f"Error fetching issues: {e}")
        return []

def compute_status_counts(issues):
    counts = {"Completed": 0, "In Progress": 0, "On Hold": 0, "Pending": 0}
    for issue in issues:
        status = issue.get("status", "Pending")
        if issue.get("is_solved") is True:
            status = "Completed"
        if status in counts:
            counts[status] += 1
        else:
            counts["Pending"] += 1
    return counts

def compute_type_counts(issues):
    counts = {}
    for issue in issues:
        category = issue.get("issue_type", "Other")
        counts[category] = counts.get(category, 0) + 1
    return counts


def fetch_user_contributions():
    contributions_ref = db.collection('user_contributions').stream()
    user_contributions = []

    for doc in contributions_ref:
        data = doc.to_dict()
        email = data.get('email')
        count = data.get('report_count', 0)
        report_ids = data.get('report_ids', [])
        last_updated_str = data.get('last_updated')
        last_updated = None
        if last_updated_str:
            try:
                last_updated = datetime.fromisoformat(last_updated_str.replace("Z", "+00:00"))
            except:
                pass

        reports = []
        for rid in report_ids:
            report_doc = db.collection('issues').document(rid).get()
            if report_doc.exists:
                report = report_doc.to_dict()
                report['id'] = rid
                reports.append(report)

        user_contributions.append({
            'email': email,
            'count': count,
            'last_updated': last_updated,
            'reports': reports
        })

    return user_contributions


from datetime import datetime, timezone, timedelta
import logging

@app.route('/admin_dashboard')
def admin_dashboard():
    try:
        issues_ref = db.collection('issues').stream()
        issues = []

        status_counts = {
            'Completed': 0,
            'In Progress': 0,
            'On Hold': 0,
            'Pending': 0
        }

        category_status_counts = {
            'Civic': {'Completed': 0, 'In Progress': 0, 'On Hold': 0, 'Pending': 0, 'Total': 0},
            'Crime': {'Completed': 0, 'In Progress': 0, 'On Hold': 0, 'Pending': 0, 'Total': 0},
            'Traffic': {'Completed': 0, 'In Progress': 0, 'On Hold': 0, 'Pending': 0, 'Total': 0},
            'Event': {'Completed': 0, 'In Progress': 0, 'On Hold': 0, 'Pending': 0, 'Total': 0},
            'Other': {'Completed': 0, 'In Progress': 0, 'On Hold': 0, 'Pending': 0, 'Total': 0}
        }

        user_first_submission = {}

        for doc in issues_ref:
            issue_data = doc.to_dict()
            issue_data['id'] = doc.id

            status = (issue_data.get('status') or 'Pending').strip()
            issue_type = (issue_data.get('issue_type') or 'Other').strip()

            if issue_type not in category_status_counts:
                issue_type = 'Other'
            if status not in category_status_counts[issue_type]:
                status = 'Pending'

            status_counts[status] = status_counts.get(status, 0) + 1
            category_status_counts[issue_type][status] += 1
            category_status_counts[issue_type]['Total'] += 1

            issue_data['status'] = status
            issue_data['issue_type'] = issue_type
            issue_data['name'] = issue_data.get('name', 'Anonymous').strip()
            issue_data['creator_email'] = issue_data.get('creator_email', 'N/A')
            issue_data['description'] = issue_data.get('description', 'No description')
            issue_data['timestamp'] = issue_data.get('timestamp', '')

            email = issue_data['creator_email']
            timestamp_str = issue_data['timestamp']
            if email and timestamp_str:
                try:
                    ts = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                    if email not in user_first_submission or ts < user_first_submission[email]:
                        user_first_submission[email] = ts
                except Exception as parse_err:
                    logging.warning(f"Invalid timestamp format for {email}: {timestamp_str}")

            issues.append(issue_data)

        recent_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        new_user_count = sum(1 for t in user_first_submission.values() if t > recent_cutoff)

        # ✅ Get total user contributions from helper
        user_contributions = fetch_user_contributions()

        return render_template(
            "admin_dashboard.html",
            issues=issues,
            status_counts=status_counts,
            category_status_counts=category_status_counts,
            new_user_count=new_user_count,
            user_contributions=user_contributions
        )

    except Exception as e:
        return f"An error occurred: {str(e)}", 500


@app.route('/update_status', methods=['POST'])
def update_status():
    try:
        issue_id = request.form['issue_id']
        new_status = request.form['status']

        issue_ref = db.collection('issues').document(issue_id)
        issue_ref.update({'status': new_status})

        return jsonify({"success": True}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

@app.route('/user_contributions')
def user_contributions_page():
    try:
        contributions_ref = db.collection('user_contributions').stream()
        user_contributions = []

        for doc in contributions_ref:
            data = doc.to_dict()
            email = data.get('email')
            count = data.get('report_count', 0)
            report_ids = data.get('report_ids', [])
            last_updated_str = data.get('last_updated')
            last_updated = None
            if last_updated_str:
                try:
                    last_updated = datetime.fromisoformat(last_updated_str.replace("Z", "+00:00"))
                except:
                    pass

            user_contributions.append({
                'email': email,
                'count': count,
                'last_updated': last_updated,
                'report_ids': report_ids  
            })

        return render_template("user_contributions.html", user_contributions=user_contributions)
    except Exception as e:
        return f"Error loading contributions: {str(e)}", 500



if __name__ == '__main__':
    app.run(debug=True)