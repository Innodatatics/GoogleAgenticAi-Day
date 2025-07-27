def get_issues(db, role='user', email=None, solved=None):
    reports_ref = db.collection('reports')
    query = reports_ref
    if role == 'user' and email:
        query = query.where('creator_email', '==', email)
    if solved:
        query = query.where('processed', '==', solved.lower() == 'true')
    results = []
    for doc in query.stream():
        data = doc.to_dict()
        data['report_id'] = doc.id
        results.append(data)
    return results


def update_issue(db, issue_id, update_data):
    issue_ref = db.collection('reports').document(issue_id)
    issue_ref.update(update_data)


def resolve_issue(db, issue_id, resolve_data):
    issue_ref = db.collection('reports').document(issue_id)
    resolve_data['processed'] = True
    issue_ref.update(resolve_data)


def get_user_rating(db, email):
    contrib_ref = db.collection('user_contributions').document(email)
    contrib_doc = contrib_ref.get()
    if contrib_doc.exists:
        contrib = contrib_doc.to_dict()
        return contrib.get('report_count', 0)
    return 0
