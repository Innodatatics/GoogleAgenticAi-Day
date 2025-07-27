from flask import Flask, jsonify
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from datetime import datetime, timezone
from openai import OpenAI
import os
from dotenv import load_dotenv
import logging
import time
import math
import threading
import pkg_resources
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Load environment variables
load_dotenv()

# Email configuration
EMAIL_SENDER = "isronasaesa@gmail.com"
EMAIL_PASSWORD = "mbtz admz ifym kftb" 
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
ALERT_RECIPIENTS = ["eppakayalasathvik72@gmail.com", "shirish@innodatatics.com"]

# OpenAI configuration for OpenRouter
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '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')
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
SITE_URL = "https://your-site-url.com"  
SITE_NAME = "City Dashboard"

# Google Gemini and Maps API configuration
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', 'AIzaSyDdesShT5_xF_UwPXmA5WKC89iDea86qmA')
NOMINATIM_USER_AGENT = "CityDashboard/1.0 (contact: isronasaesa@gmail.com)"

# Check for required dependencies
required_packages = {
    'firebase-admin': '6.5.0',
    'google-cloud-firestore': '2.11.0',
    'openai': '1.0.0',
    'requests': '2.31.0',
    'google-generativeai': '0.7.0'
}
for pkg, min_version in required_packages.items():
    try:
        installed_version = pkg_resources.get_distribution(pkg).version
        if installed_version < min_version:
            logger.error(f"{pkg} version {installed_version} is outdated. Requires {min_version}. Install using: pip install {pkg}>={min_version}")
            exit(1)
    except pkg_resources.DistributionNotFound:
        logger.error(f"{pkg} not found. Install using: pip install {pkg}")
        exit(1)

# Initialize Firebase
try:
    cred = credentials.Certificate(r"D:\agentic-ai\Google Agentic AI Day\fluted-equinox-466506-r5-firebase-adminsdk-fbsvc-6976ac1e3b.json")
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'fluted-equinox-466506-r5.firebasestorage.app',
    })
    db = firestore.client()
    logger.info("Firebase initialized successfully")
except Exception as e:
    logger.error(f"Error initializing Firebase: {e}")
    exit(1)

# Initialize OpenAI client
try:
    client = OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=OPENROUTER_API_KEY,
    )
    logger.info("OpenAI client configured successfully")
except Exception as e:
    logger.error(f"Error configuring OpenAI client: {e}")
    exit(1)

# Initialize Gemini client
try:
    genai.configure(api_key=GOOGLE_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash-002')
    logger.info("Gemini client configured successfully")
except Exception as e:
    logger.error(f"Error configuring Gemini client: {e}")
    exit(1)

def get_relative_location(lat, lon):
    """Use Nominatim API for reverse geocoding, fall back to Google Maps API for nearest location."""
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat={lat}&lon={lon}"
        headers = {"User-Agent": NOMINATIM_USER_AGENT}
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        if 'display_name' in data:
            return data['display_name']
        else:
            logger.warning(f"Nominatim failed for {lat},{lon}: No display_name in response")
    except Exception as e:
        logger.error(f"Nominatim error for {lat},{lon}: {e}")

    try:
        if not GOOGLE_API_KEY:
            logger.warning("GOOGLE_API_KEY not set in .env")
            return f"near reported coordinates [{lat}, {lon}]"
        url = f"https://maps.googleapis.com/maps/api/geocode/json?latlng={lat},{lon}&key={GOOGLE_API_KEY}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        if data['status'] == 'OK' and data['results']:
            return data['results'][0]['formatted_address']
        else:
            logger.warning(f"Google Maps geocoding failed for {lat},{lon}: {data.get('status', 'Unknown error')}")
            return f"near reported coordinates [{lat}, {lon}]"
    except Exception as e:
        logger.error(f"Google Maps geocoding error for {lat},{lon}: {e}")
        return f"near reported coordinates [{lat}, {lon}]"

def call_openai(prompt):
    """Call OpenAI API with retry logic, fall back to Gemini API."""
    for attempt in range(3):
        try:
            completion = client.chat.completions.create(
                model="google/gemma-3n-e2b-it:free",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )
            return completion.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"OpenAI API attempt {attempt + 1} failed: {e}")
            time.sleep(2 ** attempt)
    
    try:
        response = gemini_model.generate_content(prompt)
        if response.text:
            return response.text.strip()
        else:
            logger.error("Gemini API returned empty response")
            return None
    except Exception as e:
        logger.error(f"Gemini API failed: {e}")
        return None

def send_contributor_email(creator_emails, issue, is_new=True):
    """Send email to contributors with a friendly template."""
    try:
        relative_location = issue.get('relative_location', f"near reported coordinates {issue['location']}")
        try:
            lat, lon = issue['location']
            maps_link = f"https://www.google.com/maps?q={lat},{lon}"
            logger.info(f"Generated maps link for contributor email, issue {issue['id']}: {maps_link}")
        except (TypeError, ValueError) as e:
            logger.error(f"Error generating maps link for contributor email, issue {issue['id']}: {e}")
            maps_link = "Unable to generate map link due to invalid coordinates"
        
        proofs = issue.get('proofs', [])
        logger.info(f"Proofs for contributor email, issue {issue['id']}: {proofs}")
        
        msg = MIMEMultipart()
        msg['From'] = EMAIL_SENDER
        msg['To'] = ", ".join(creator_emails)
        msg['Subject'] = f"Your Issue {'Created' if is_new else 'Updated'} - ID: {issue['id']}"
        map_preview_img = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.mapsofindia.com%2Fmaps%2Fkarnataka%2Fbangalore-map.htm&psig=AOvVaw2D7X3EGNRMXJN5fy0MQxoQ&ust=1753324966279000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCOj7-c760Y4DFQAAAAAdAAAAABAE"
        body = f"""
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Dear Contributor(s),</p>

    <p>
      Thank you for your valuable contribution to the City Dashboard! Your report has been 
      <strong>{'created as a new issue' if is_new else 'merged into an existing issue'}</strong>:
    </p>

    <ul>
      <li><strong>Issue ID:</strong> {issue['id']}</li>
      <li><strong>Issue Type:</strong> {issue['issue_type']}</li>
      <li><strong>Description:</strong> {issue['description']}</li>
      <li><strong>Location:</strong> {relative_location}</li>
      <li><strong>View on Google Maps:</strong> <a href="{maps_link}">{maps_link}</a></li>
      <li><strong>Number of Reports:</strong> {issue['no_of_reports']}</li>
      <li><strong>Priority:</strong> {issue['priority']}</li>
      <li><strong>Proofs:</strong> {', '.join(proofs) if proofs else 'None'}</li>
      <li><strong>Timestamp:</strong> {issue['timestamp']}</li>
      <li><strong>Last Updated:</strong> {issue['last_updated']}</li>
    </ul>

    <p>We appreciate your efforts in making our city better!</p>

    <p>Regards,<br>
    City Dashboard Team</p>
    <p>
      <a href="{maps_link}">
        <img src="{map_preview_img}" alt="Click to view map" style="margin-top: 15px; border: 1px solid #ccc; max-width: 600px;">
      </a>
    </p>
  </body>
</html>
"""

        msg.attach(MIMEText(body, 'html'))
        logger.debug(f"Contributor email body for issue {issue['id']}:\n{body}")
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)
        logger.info(f"Contributor email sent to {creator_emails} for issue {issue['id']}")
    except Exception as e:
        logger.error(f"Error sending contributor email to {creator_emails}: {e}")

def send_authority_email(issue, is_new=True):
    """Send email to authorities with a professional template."""
    try:
        relative_location = issue.get('relative_location', f"near reported coordinates {issue['location']}")
        try:
            lat, lon = issue['location']
            maps_link = f"https://www.google.com/maps?q={lat},{lon}"
            logger.info(f"Generated maps link for authority email, issue {issue['id']}: {maps_link}")
        except (TypeError, ValueError) as e:
            logger.error(f"Error generating maps link for authority email, issue {issue['id']}: {e}")
            maps_link = "Unable to generate map link due to invalid coordinates"
        
        prompt = f"""
        Generate a concise description (50-100 words) for an issue based on the following details:
        Issue Type: {issue['issue_type']}
        Description: {issue['description']}
        Location: {relative_location}
        Number of Reports: {issue['no_of_reports']}
        Priority: {issue['priority']}
        The description should be professional, clear, and suitable for alerting authorities. Try not to use bold lettering, just give it in normal.
        """
        ai_desc = call_openai(prompt) or "No description generated due to API failure."
        proofs = issue.get('proofs', [])
        logger.info(f"Proofs for authority email, issue {issue['id']}: {proofs}")
        
        msg = MIMEMultipart()
        msg['From'] = EMAIL_SENDER
        msg['To'] = ", ".join(ALERT_RECIPIENTS)
        msg['Subject'] = f"Alert: Issue {'Created' if is_new else 'Updated'} - ID: {issue['id']}"
        map_preview_img = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.mapsofindia.com%2Fmaps%2Fkarnataka%2Fbangalore-map.htm&psig=AOvVaw2D7X3EGNRMXJN5fy0MQxoQ&ust=1753324966279000&source=images&cd=vfe&opi=89978449&ved=0CBUQjRxqFwoTCOj7-c760Y4DFQAAAAAdAAAAABAE"
        body = f"""
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6;">
    <p>Dear Authorities,</p>

    <p>
      A new issue has been <strong>{'reported' if is_new else 'updated'}</strong> in the City Dashboard system, requiring your attention:
    </p>

    <ul>
      <li><strong>Issue ID:</strong> {issue['id']}</li>
      <li><strong>Issue Type:</strong> {issue['issue_type']}</li>
      <li><strong>Description:</strong> {ai_desc}</li>
      <li><strong>Location:</strong> {relative_location}</li>
      <li><strong>View on Google Maps:</strong> <a href="{maps_link}">{maps_link}</a></li>
      <li><strong>Number of Reports:</strong> {issue['no_of_reports']}</li>
      <li><strong>Priority:</strong> {issue['priority']}</li>
      <li><strong>Proofs:</strong> {', '.join(proofs) if proofs else 'None'}</li>
      <li><strong>Last Updated:</strong> {issue['last_updated']}</li>
    </ul>

    <p>Please take appropriate action.</p>

    <p>Regards,<br>
    City Dashboard Team</p>
    <p>
      <a href="{maps_link}">
        <img src="{map_preview_img}" alt="Click to view map" style="margin-top: 15px; border: 1px solid #ccc; max-width: 600px;">
      </a>
    </p>
  </body>
</html>
"""

        msg.attach(MIMEText(body, 'html'))
        logger.debug(f"Authority email body for issue {issue['id']}:\n{body}")
        
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)
        logger.info(f"Authority email sent to {ALERT_RECIPIENTS} for issue {issue['id']}")
    except Exception as e:
        logger.error(f"Error sending authority email to {ALERT_RECIPIENTS}: {e}")

def are_locations_similar(loc1, loc2, threshold_km=0.5):
    """Check if two locations are within threshold_km kilometers."""
    try:
        lat1, lon1 = loc1
        lat2, lon2 = loc2
        R = 6371  # Earth's radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        return distance <= threshold_km
    except Exception as e:
        logger.error(f"Error comparing locations {loc1} and {loc2}: {e}")
        return False

def process_report(report, report_id):
    """Process a single report and merge with existing issues or create a new one."""
    try:
        # Re-fetch report to ensure latest proofs
        report_ref = db.collection('reports').document(report_id)
        time.sleep(10)  # Wait 10 seconds for proof uploads
        report_doc = report_ref.get()
        if not report_doc.exists:
            logger.error(f"Report {report_id} no longer exists")
            return
        report = report_doc.to_dict() | {'id': report_id}
        logger.info(f"Fetched report {report_id} with proofs: {report.get('proofs', [])}")
        
        # Get relative location
        lat, lon = report['location']
        relative_location = get_relative_location(lat, lon)
        
        # Check for existing issues
        issues_ref = db.collection('issues').where(filter=FieldFilter('issue_type', '==', report['issue_type']))
        issues = [doc.to_dict() | {'id': doc.id} for doc in issues_ref.stream()]
        
        merged = False
        for issue in issues:
            if are_locations_similar(report['location'], issue['location']):
                # Merge into existing issue
                issue['no_of_reports'] += 1
                issue['related_report_ids'].append(report_id)
                if report['creator_email'] not in issue['creator_emails']:
                    issue['creator_emails'].append(report['creator_email'])
                issue['proofs'] = list(set(issue.get('proofs', []) + report.get('proofs', [])))
                issue['priority'] = 'very important' if issue['no_of_reports'] > 5 else 'normal'
                issue['last_updated'] = datetime.now(timezone.utc).isoformat()
                issue['relative_location'] = relative_location
                logger.info(f"Merging report {report_id} into issue {issue['id']} with proofs: {issue['proofs']}")
                
                db.collection('issues').document(issue['id']).set(issue)
                db.collection('reports').document(report_id).update({'processed': True})
                logger.info(f"Merged report {report_id} into issue {issue['id']}")
                send_contributor_email(issue['creator_emails'], issue, is_new=False)
                send_authority_email(issue, is_new=False)
                merged = True
                break
        
        if not merged:
            # Create new issue
            issue = {
                'id': '',
                'issue_type': report['issue_type'],
                'description': report['description'],
                'location': report['location'],
                'relative_location': relative_location,
                'no_of_reports': 1,
                'priority': 'normal',
                'related_report_ids': [report_id],
                'creator_emails': [report['creator_email']],
                'proofs': report.get('proofs', []),
                'timestamp': report['timestamp'],
                'applause': 0,
                'is_solved': False,
                'time_created': datetime.now(timezone.utc).isoformat(),
                'last_updated': datetime.now(timezone.utc).isoformat()
            }
            logger.info(f"Creating new issue for report {report_id} with proofs: {issue['proofs']}")
            doc_ref = db.collection('issues').add(issue)
            issue_id = doc_ref[1].id
            issue['id'] = issue_id
            db.collection('issues').document(issue_id).set(issue)
            db.collection('reports').document(report_id).update({'processed': True})
            logger.info(f"Created new issue {issue_id} for report {report_id}")
            send_contributor_email(issue['creator_emails'], issue, is_new=True)
            send_authority_email(issue, is_new=True)
    except Exception as e:
        logger.error(f"Error processing report {report_id}: {e}")

def poll_reports():
    """Poll reports collection periodically for new entries."""
    while True:
        try:
            query = db.collection('reports').where(filter=FieldFilter('processed', '==', False)).limit(10)
            reports = [doc.to_dict() | {'id': doc.id} for doc in query.stream()]
            if reports:
                logger.info(f"Found {len(reports)} unprocessed reports")
                for report in reports:
                    # Retry fetching report to ensure proofs are available
                    for attempt in range(5):
                        report_ref = db.collection('reports').document(report['id'])
                        report_doc = report_ref.get()
                        if report_doc.exists:
                            report_data = report_doc.to_dict() | {'id': report['id']}
                            proofs = report_data.get('proofs', [])
                            logger.info(f"Attempt {attempt + 1} for report {report['id']}: proofs = {proofs}")
                            if proofs or attempt == 4:
                                process_report(report_data, report['id'])
                                break
                            logger.warning(f"Attempt {attempt + 1}: No proofs for report {report['id']}, retrying...")
                            time.sleep(5)
            else:
                logger.debug("No unprocessed reports found")
            time.sleep(10)
        except Exception as e:
            logger.error(f"Error polling reports: {e}")
            time.sleep(30)

@app.route('/status', methods=['GET'])
def status():
    """Endpoint to check if the report poller is running."""
    return jsonify({"message": "Report poller is running", "timestamp": datetime.now(timezone.utc).isoformat()}), 200

def start_poller():
    """Start the Firestore poller in a separate thread."""
    threading.Thread(target=poll_reports, daemon=True).start()

if __name__ == '__main__':
    start_poller()
    app.run(port=5001, debug=True)