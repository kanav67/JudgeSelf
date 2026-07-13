# ⚡ JudgeSelf

> Currently in **active development**. 

The project is meant to be a high-performance, self-hostable competitive programming and Online Assessment (OA) platform. 

Designed from the ground up for massive concurrency, the primary goal of this architecture is to gracefully handle coordinated traffic spikes of **10,000 to 15,000 concurrent participants** submitting code simultaneously, without starving database connections or locking up the user interface.

## 🏗️ Architecture & Design Decisions
<img width="80%" alt="judgeself drawio (1)" src="https://github.com/user-attachments/assets/a8a7aadf-10ed-460c-a983-f02e133f0872" />
  

Here is the summary of the architecture and some design choices for this stack:
* **Frontend (Next.js):** Chosen for its robust caching mechanisms and Server-Side Rendering (SSR).
* **Core APIs:**
  * **Main API (Express.js):** Handles core CRUD operations, user authentication, and contest management. Express was chosen for its simplicity and widespread adoption.
  * **Leaderboard Service (Express.js):** Manages real-time contest standings. It consumes execution verdicts via RabbitMQ, updates live rankings instantly using Redis Sorted Sets, and persists frozen leaderboards to Database post contest.
  * **Status Service (Express.js):** Handles live submission tracking. It listens to the Execution Engine via Redis Pub/Sub, stores ephemeral states in Redis hashes, and serves the status pages efficiently from cache and the database.
  * **Polygon Service (Express.js):** A service bridging the platform with Codeforces Polygon. It is responsible for pulling problem packages via API, compiling test cases (if needed), zipping and uploading problem data to PostgreSQL and S3.

* **Ingestion Layer:**
  * **Submission Service (Go):** A dedicated, lightweight Go microservice purely for ingesting code submissions. It uses stateless JWT verification to authenticate requests and immediately pushes jobs to RabbitMQ, bypassing the main Express API entirely to prevent bottlenecks.
  * **Execution Engine (Go):** Written entirely from scratch in Go to leverage its exceptional low-level performance and rapid process spawning. Instead of relying on heavy Docker containers for execution, this engine directly wraps the Linux `isolate` sandbox using `os/exec`. This provides bare-metal execution speeds with millisecond-accurate CPU and memory constraints.
* **Event & Data Layer:** 
  * **RabbitMQ:** Durable queueing so no submission is ever dropped even during crashes/restarts. Also handles finals verdicts for leaderboard.
  * **Redis:** Powers the real-time leaderboard (using Sorted Sets) and Pub/Sub for live Status updates.
  * **PostgreSQL:** The primary relational database.
  * **S3 / MinIO:** Object storage for handling large (10MB+) problem ZIP files ingested from Polygon.

## 🚀 Deployment

* **Current Status (Docker Compose):** JudgeSelf is designed to be easily self-hostable. The entire microservices suite, including the databases and execution workers, can currently be spun up locally or on a single VPS using `docker-compose`.
* ` Note: Ideally one should deploy the execution-engine on a separate machine `
* **Future Scaling (Kubernetes):** As the platform matures and for deployments expecting the full 15k+ user load, the architecture is strictly containerized to allow for a seamless transition to Kubernetes (K8s). This will enable Horizontal Pod Autoscaling (HPA) for the Go Execution Workers during contest spikes.

## 🗺️ Roadmap & Future Features

- [ ] **Live Telemetry & Event Tracking:** Capturing batched AST/Code-diffs and browser events via WebSockets.
- [ ] **Code Replay (Anti-Cheat):** Utilizing the telemetry data to generate a video-like replay timeline of a user's coding session, primarily designed for Online Assessments (OAs).
- [ ] **Kubernetes Manifests:** Official Helm charts / K8s manifests for enterprise-scale deployments.
