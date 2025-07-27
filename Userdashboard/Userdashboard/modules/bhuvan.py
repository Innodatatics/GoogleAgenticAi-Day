def get_alternate_route(source, destination):
    # Dummy alternate route
    return {
        "from": source,
        "to": destination,
        "route": [
            {"lat": 17.385044, "lng": 78.486671},
            {"lat": 17.422731, "lng": 78.513336},
            {"lat": 17.442177, "lng": 78.454455}
        ],
        "message": "This is a simulated alternate route."
    }
