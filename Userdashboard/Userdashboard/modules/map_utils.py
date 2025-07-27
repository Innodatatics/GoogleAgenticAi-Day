from datetime import datetime

def compute_turnaround_time(issue):
    try:
        if 'timestamp' in issue:
            reported_time = datetime.fromisoformat(issue['timestamp'].replace('Z', '+00:00'))
            issue['turnaround_time_minutes'] = (datetime.utcnow() - reported_time).total_seconds() // 60
    except Exception as e:
        issue['turnaround_time_minutes'] = None
