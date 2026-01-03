frontend:
  - task: "Video upload and apply changes functionality"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/components/WebsiteBuilder.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: "NA"
        agent: "testing"
        comment: "Initial test setup - need to verify video upload and apply changes works without redirecting to Admin Panel"

metadata:
  created_by: "testing_agent"
  version: "1.0"
  test_sequence: 1

test_plan:
  current_focus:
    - "Video upload and apply changes functionality"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "testing"
    message: "Starting test of video upload functionality in Website Builder. Need to verify that clicking 'Aplicar cambios' after uploading video does not redirect to Admin Panel."