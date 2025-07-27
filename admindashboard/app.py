
from flask import Flask, request, jsonify
from flask_cors import CORS
from firebase_admin import credentials, firestore, initialize_app
import logging
import os
from datetime import datetime, timezone, timedelta
import json

# --- Configuration ---
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Firebase Initialization ---
try:
    # IMPORTANT: Replace this with the actual path to your Firebase Admin SDK JSON file.
    cred_path = r"D:\agentic-ai\Google Agentic AI Day\fluted-equinox-466506-r5-firebase-adminsdk-fbsvc-6976ac1e3b.json" # <-- UPDATE THIS PATH
    
    if not os.path.exists(cred_path):
        raise FileNotFoundError(f"Firebase credentials not found at: {cred_path}. Please update the path.")
        
    cred = credentials.Certificate(cred_path)
    initialize_app(cred)
    db = firestore.client()
    logger.info("Firebase initialized successfully.")

except Exception as e:
    logger.error(f"FATAL: Error initializing Firebase: {e}")
    db = None

# --- Flask App Initialization ---
app = Flask(__name__)
CORS(app)

# --- Helper Functions ---
def map_doc_to_issue(doc):
    data = doc.to_dict()
    if not data or not data.get('description'): return None
    creator_emails = data.get('creator_emails', [])
    primary_email = creator_emails[0] if creator_emails else 'N/A'
    status = 'Completed' if data.get('is_solved') is True else data.get('status', 'Pending')
    return {
        'id': doc.id,
        'description': data.get('description', 'No description provided.'),
        'issue_type': data.get('issue_type', 'Other'),
        'location': data.get('location', 'Unknown Location'),
        'status': status,
        'creator_email': primary_email,
        'name': data.get('name', 'Anonymous'),
        'timestamp': data.get('last_updated', datetime.now(timezone.utc).isoformat()),
        'assigned_department': data.get('assigned_department'),
        'completed_timestamp': data.get('completed_timestamp')
    }

def fetch_issues(department_filter=None):
    if not db: raise ConnectionError("Firestore is not initialized.")
    collections_to_query = [department_filter] if department_filter else ['issues', 'Police', 'Emergency Services', 'Municipality']
    all_issues = []
    for collection_name in collections_to_query:
        for doc in db.collection(collection_name).stream():
            issue = map_doc_to_issue(doc)
            if issue: all_issues.append(issue)
            else: logger.warning(f"Skipping invalid document ID '{doc.id}' in '{collection_name}'.")
    return all_issues

def get_user_contributions():
    if not db: raise ConnectionError("Firestore is not initialized.")
    contributions = []
    for doc in db.collection('user_contributions').stream():
        data = doc.to_dict()
        if data and data.get('email'): contributions.append({'email': data.get('email'), 'count': data.get('report_count', 0)})
        else: logger.warning(f"Skipping invalid user_contribution doc ID '{doc.id}'.")
    return contributions

def find_document(doc_id):
    if not db: raise ConnectionError("Firestore is not initialized.")
    for collection_name in ['issues', 'Police', 'Emergency Services', 'Municipality']:
        doc_ref = db.collection(collection_name).document(doc_id)
        doc = doc_ref.get()
        if doc.exists: return doc_ref, doc.to_dict()
    return None, None

def fetch_social_insights():
    """
    Loads social insights from a local JSON file for demonstration purposes.
    """
    try:
        # The JSON file is expected to be in the same directory as the Flask app.
        with open('social-insights-dummy-data.json', 'r') as f:
            insights = json.load(f)
        logger.info(f"Successfully loaded {len(insights)} dummy social insights.")
        return insights
    except FileNotFoundError:
        logger.error("social-insights-dummy-data.json not found. Returning empty list.")
        return []
    except json.JSONDecodeError:
        logger.error("Error decoding social-insights-dummy-data.json. Returning empty list.")
        return []
    except Exception as e:
        logger.error(f"An unexpected error occurred while fetching social insights: {e}")
        return []


# --- API Endpoints ---
@app.route('/api/get_social_insights', methods=['GET'])
def get_social_insights_api():
    try:
        return jsonify(fetch_social_insights())
    except Exception as e:
        logger.error(f"Error in /api/get_social_insights: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/get_issues', methods=['GET'])
def get_issues_api():
    if db is None: return jsonify({"error": "Database not available"}), 503
    try:
        return jsonify(fetch_issues(request.args.get('department')))
    except Exception as e:
        logger.error(f"Error in /api/get_issues: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/assign_department', methods=['POST'])
def assign_department_api():
    if db is None: return jsonify({"error": "Database not available"}), 503
    try:
        issue_id = request.form.get('issue_id')
        department = request.form.get('department')
        if not all([issue_id, department]): return jsonify({"error": "Missing form data"}), 400
        source_ref = db.collection('issues').document(issue_id)
        target_ref = db.collection(department).document(issue_id)
        @firestore.transactional
        def move_issue(transaction, source_ref, target_ref):
            issue_doc = source_ref.get(transaction=transaction)
            if not issue_doc.exists: raise FileNotFoundError(f"Issue {issue_id} not found.")
            issue_data = issue_doc.to_dict()
            issue_data.update({'assigned_department': department, 'status': 'In Progress'})
            transaction.set(target_ref, issue_data)
            transaction.delete(source_ref)
        move_issue(db.transaction(), source_ref, target_ref)
        logger.info(f"Moved issue '{issue_id}' to collection '{department}'")
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error in /api/assign_department: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/user_contributions', methods=['GET'])
def user_contributions_api():
    if db is None: return jsonify({"error": "Database not available"}), 503
    try:
        return jsonify(get_user_contributions())
    except Exception as e:
        logger.error(f"Error in /api/user_contributions: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/issues_by_user', methods=['GET'])
def get_issues_by_user():
    if db is None: return jsonify({"error": "Database not available"}), 503
    user_email = request.args.get('email')
    if not user_email: return jsonify({"error": "Email parameter is required"}), 400
    try:
        all_user_issues = []
        for collection_name in ['issues', 'Police', 'Emergency Services', 'Municipality']:
            issues_ref = db.collection(collection_name).where('creator_emails', 'array_contains', user_email).stream()
            for doc in issues_ref:
                issue = map_doc_to_issue(doc)
                if issue: all_user_issues.append(issue)
        return jsonify(all_user_issues)
    except Exception as e:
        # Check if the error message from Firestore indicates a missing index.
        error_str = str(e).lower()
        if "requires an index" in error_str or "no matching index found" in error_str:
            logger.error(f"Firestore index missing for query on creator_emails: {e}")
            return jsonify({
                "error": "A database query failed because a required index is missing. Please check your Firestore indexes. You can usually create the required index by following the link in the error message in your backend logs."
            }), 500
        logger.error(f"Error fetching issues for user {user_email}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/update_status', methods=['POST'])
def update_status_api():
    if db is None: return jsonify({"error": "Database not available"}), 503
    try:
        issue_id = request.form.get('issue_id')
        new_status = request.form.get('status')
        if not all([issue_id, new_status]): return jsonify({"error": "Missing form data"}), 400
        doc_ref, _ = find_document(issue_id)
        if not doc_ref: return jsonify({"error": f"Issue {issue_id} not found."}), 404
        update_data = {'status': new_status, 'is_solved': new_status == 'Completed'}
        if new_status == 'Completed': update_data['completed_timestamp'] = datetime.now(timezone.utc).isoformat()
        doc_ref.update(update_data)
        logger.info(f"Updated status for issue '{issue_id}' to '{new_status}'")
        return jsonify({"success": True})
    except Exception as e:
        logger.error(f"Error in /api/update_status: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/create_issue', methods=['POST'])
def create_issue():
    if db is None:
        return jsonify({"error": "Database not available"}), 503
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid JSON"}), 400
        
        # You can add more robust validation here
        required_fields = ['name', 'email', 'phone', 'issue_type', 'description', 'location']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400

        doc_ref = db.collection('issues').document()
        
        issue_data = {
            'name': data['name'],
            'creator_emails': [data['email']],
            'phone': data['phone'],
            'issue_type': data['issue_type'],
            'description': data['description'],
            'location': data['location'],
            'duration': data.get('duration'),
            'affects_traffic_flow': data.get('traffic_flow') == 'Yes',
            'causing_harm': data.get('causing_harm') == 'Yes',
            'status': 'Pending',
            'is_solved': False,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'last_updated': datetime.now(timezone.utc).isoformat()
        }
        
        doc_ref.set(issue_data)
        
        logger.info(f"Created new issue with ID: {doc_ref.id}")
        return jsonify({"success": True, "id": doc_ref.id})

    except Exception as e:
        logger.error(f"Error in /api/create_issue: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/status', methods=['GET'])
def status_check():
    db_status = "connected" if db else "disconnected"
    return jsonify({"status": "healthy", "database": db_status})

# --- Main Execution ---
if __name__ == '__main__':
    if db is None:
        logger.critical("Could not connect to Firebase. The application cannot start.")
    else:
        app.run(host='0.0.0.0', port=5000, debug=True)

    