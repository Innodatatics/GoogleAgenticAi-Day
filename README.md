![WhatsApp Image 2025-07-27 at 08 29 12_c6a2f3b8](https://github.com/user-attachments/assets/ee7b73b1-c483-47c6-b828-5117c7b0b725)


# NammaDrishtiAI

NammaDrishtiAI is an innovative Agentic AI application designed to manage city data overload by synthesizing real-time urban data, enabling citizen reporting, predicting issues, and visualizing insights on a map-based dashboard using Google Cloud technologies. Developed by the InnoAlForce team for the Google Cloud Agentic AI Day, this solution empowers citizens and authorities with actionable insights to enhance urban management and public safety.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [File Structure](#file-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Future Scope](#future-scope)
- [Contact Information](#contact-information)

## Overview
NammaDrishtiAI addresses the challenge of managing city data overload by leveraging Gemini AI to synthesize scattered data from social media, traffic feeds, and citizen reports into a single, reliable source of truth. The application provides real-time alerts, predictive analytics, and a map-based dashboard for urban planners, emergency responders, and administrators. It supports multimodal citizen inputs, sentiment-based mood mapping, and scalable integration into Smart City Command Centres.

## Features
- **Real-Time Data Synthesis**: Uses Gemini AI to merge multiple data points into actionable advisories.
- **Multimodal Citizen Reporting**: Allows citizens to report issues via various input methods, with automated event mapping.
- **Predictive Analytics**: Forecasts congestion and safety issues during events like rallies or concerts.
- **Sentiment-Based Mood Mapping**: Analyzes public sentiment using NLP to identify citizen satisfaction and unrest.
- **Map-Based Dashboard**: Visualizes insights for decision-makers with zone-wise indicators.
- **Scalable Architecture**: Modular design integrates with Google Cloud Firebase and Gemini APIs.
- **Feedback Loop**: Continuously learns from new events to improve alert accuracy.
- **Early Detection & Escalation**: Automatically escalates critical issues (e.g., protests, accidents) to authorities.
- **Traffic Optimization**: Enables proactive rerouting and public safety planning.

## Technologies Used
- **Google AI Technologies**:
  - Gemini AI: Data synthesis, multimodal analysis, and real-time alerts.
  - Google Maps API: Real-time visualization and geolocation services.
  - Distance Matrix API, Geocoding API, Directions API: Route optimization and location services.
  - Google News API: Social insights extraction.
  - Gmail API: Automated email notifications.
- **Backend**:
  - Google Firebase/Firestore: Scalable data storage and real-time updates.
  - Firebase Studio: Deployment and management.
- **Analytics**:
  - NumPy: Sentiment analysis and data processing.
- **Development**:
  - Flask: Backend API development.
  - Google Android Development: Mobile app integration.

## File Structure
```
NammaDrishtiAI/
├── app.py                  # Flask backend for handling issues, notifications, and routes
├── analyze_reports.py      # Analyzes Firebase reports, merges data, generates issues, and sends notifications
├── serviceAccountKey.json  # Firebase credentials (not included in repo)
├── modules/
│   ├── issues.py          # Functions for creating, updating, and resolving issues
│   ├── notifications.py   # Functions for managing notifications
│   ├── map_utils.py       # Utilities for computing turnaround times
│   ├── bhuvan.py          # Functions for calculating alternate routes
├── static/
│   ├── images/            # Screenshots and diagrams
│   │   ├── dashboard.png
│   │   ├── process_flow.png
│   │   ├── architecture.png
│   │   ├── wireframes/
│   │   │   ├── search_issues.png
│   │   │   ├── social_insights.png
│   │   │   ├── user_management.png
│   │   │   ├── predictive_analysis.png
│   │   │   ├── assign_with_ai.png
│   │   │   ├── mobile_app.png
│   │   │   ├── email_alerts.png
├── README.md              # Project documentation
└── requirements.txt       # Python dependencies
```

## Installation
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/InnoAlForce/NammaDrishtiAI.git
   cd NammaDrishtiAI
   ```

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set Up Firebase**:
   - Create a Firebase project and download the `serviceAccountKey.json` file.
   - Place `serviceAccountKey.json` in the root directory.
   - Configure Firebase Firestore and enable required APIs (Google Maps, Distance Matrix, Geocoding, Directions, Google News, Gmail).

4. **Environment Setup**:
   - Ensure Python 3.8+ is installed.
   - Set up environment variables for API keys if needed.

5. **Run the Application**:
   ```bash
   python app.py
   ```

6. **Deploy to Firebase Studio**:
   - Use Firebase CLI to deploy the application:
     ```bash
     firebase deploy
     ```

## Usage
- **Backend API**:
  - Access the API at `http://localhost:5000` (or deployed URL).
  - Endpoints:
    - `POST /create_issue`: Create a new issue.
    - `GET /get_issues`: Retrieve issues based on role, email, or status.
    - `POST /resolve_issue/<id>`: Mark an issue as resolved.
    - `POST /update_issue/<id>`: Update an existing issue.
    - `GET /notifications`: Fetch notifications.
    - `POST /alternate_route`: Get alternate routes using geolocation data.

- **Dashboard**:
  - Admin Analytics: View real-time alerts, current issues, and social insights.
  - Create Issue: Report new issues with multimodal inputs.
  - Search: Query issues or tickets.
  - Social Insights: Analyze news and public sentiment.
  - Predictive Analysis: View AI-driven congestion and safety predictions.

- **Mobile App**:
  - Supports issue reporting, email alerts, and real-time updates via Google Android Development.

- **Report Analysis**:
  - `analyze_reports.py` processes Firebase reports, merges multiple data points, generates issues, and sends email notifications to contributors and authorities.

## Screenshots
Below are key visuals of the NammaDrishtiAI application:

- **Dashboard Overview**:
<img width="2040" height="869" alt="image" src="https://github.com/user-attachments/assets/54017d5e-349b-4145-b979-ea5f315d27f9" />
<img width="2040" height="859" alt="image" src="https://github.com/user-attachments/assets/b855c3c3-4fe9-4841-b243-d380cc245940" />


- **Process Flow Diagram**:
  <img width="1516" height="1001" alt="image" src="https://github.com/user-attachments/assets/56e31f78-83ed-464d-8dd2-420b3e664ccb" />


- **Architecture Diagram**:
 <img width="1504" height="1003" alt="image" src="https://github.com/user-attachments/assets/f5d738c9-aff3-42c5-a3fa-c744cdd93ff9" />


- **Wireframes**:
  - Search Issues: <img width="2040" height="826" alt="image" src="https://github.com/user-attachments/assets/5193da77-7e90-415e-90e0-bd39a063948d" />

  - Social Insights: <img width="2040" height="892" alt="image" src="https://github.com/user-attachments/assets/eca98d6b-a124-423f-ac68-e477d4c3b8d3" />

  - User Management: <img width="2066" height="902" alt="image" src="https://github.com/user-attachments/assets/87fb775e-1a54-44f9-a64f-ae4a60a530f4" />

  - Predictive Analysis: <img width="2040" height="914" alt="image" src="https://github.com/user-attachments/assets/27450815-e833-4497-b9b3-518cbed42133" />

  - Assign with AI: <img width="968" height="865" alt="image" src="https://github.com/user-attachments/assets/7b76c0d7-d439-4a8e-916d-c1c84974def9" />

  - Mobile App: <img width="2025" height="983" alt="image" src="https://github.com/user-attachments/assets/05841d14-ba33-47b3-b579-64801555c591" />

  - Email Alerts: <img width="2064" height="620" alt="image" src="https://github.com/user-attachments/assets/b263f76c-95b2-4d69-a991-983623c1bcb7" />


## Future Scope
- Expand integration with additional Smart City platforms.
- Enhance AI models for hyper-local predictions.
- Incorporate more data sources (e.g., IoT sensors, weather APIs).
- Develop cross-platform support for iOS.
- Improve sentiment analysis with advanced NLP models.
- Enable real-time collaboration features for authorities.

## Contact Information
- **Team Leader**: Shirish G Kumar
- **Email**: shirish@innodatatics.com
- **Organization**: Innodatatics

Thank you for exploring NammaDrishtiAI! This solution transforms urban data management by providing actionable, AI-driven insights for smarter cities.
