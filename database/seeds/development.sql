-- ================================================================
-- LearnSphere MVP — Development Seed Data
-- ================================================================

-- 1. CLEANUP PREVIOUS SEED DATA
TRUNCATE TABLE 
  audit_logs,
  course_views,
  learning_activity,
  point_transactions,
  user_badges,
  badges,
  user_achievements,
  achievements,
  quiz_answers,
  quiz_attempts,
  quiz_options,
  quiz_questions,
  quizzes,
  lesson_progress,
  enrollments,
  lessons,
  course_tags,
  tags,
  courses,
  profiles,
  sessions,
  users
CASCADE;

-- 2. USERS
-- Passwords:
-- Admin: AdminPass123! ($2a$12$qMT51jJ3IaxrWi/VYLRAQOfOZp.kAXJVoaOEIjU4WFz1Gq6wFrwTi)
-- Instructors: InstructorPass123! ($2a$12$1lchP3cd7tkDkuUXvFxf9OOzxNhY7RXgGFbu3WR.6zxuPIk7Tnn3e)
-- Learners: LearnerPass123! ($2a$12$OwtyhCV33Li.ydxT82lbI.Zl6EegdQwscRJs/o5L1RkxYpWRuly/m)

INSERT INTO users (id, email, password_hash, role, is_active, created_at) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@learnsphere.dev', '$2a$12$qMT51jJ3IaxrWi/VYLRAQOfOZp.kAXJVoaOEIjU4WFz1Gq6wFrwTi', 'admin', true, NOW() - INTERVAL '60 days'),
('00000000-0000-0000-0000-000000000002', 'sarah.instructor@learnsphere.dev', '$2a$12$1lchP3cd7tkDkuUXvFxf9OOzxNhY7RXgGFbu3WR.6zxuPIk7Tnn3e', 'instructor', true, NOW() - INTERVAL '55 days'),
('00000000-0000-0000-0000-000000000003', 'david.instructor@learnsphere.dev', '$2a$12$1lchP3cd7tkDkuUXvFxf9OOzxNhY7RXgGFbu3WR.6zxuPIk7Tnn3e', 'instructor', true, NOW() - INTERVAL '50 days'),
('00000000-0000-0000-0000-000000000011', 'alex.learner@learnsphere.dev', '$2a$12$OwtyhCV33Li.ydxT82lbI.Zl6EegdQwscRJs/o5L1RkxYpWRuly/m', 'learner', true, NOW() - INTERVAL '40 days'),
('00000000-0000-0000-0000-000000000012', 'maya.learner@learnsphere.dev', '$2a$12$OwtyhCV33Li.ydxT82lbI.Zl6EegdQwscRJs/o5L1RkxYpWRuly/m', 'learner', true, NOW() - INTERVAL '35 days'),
('00000000-0000-0000-0000-000000000013', 'liam.learner@learnsphere.dev', '$2a$12$OwtyhCV33Li.ydxT82lbI.Zl6EegdQwscRJs/o5L1RkxYpWRuly/m', 'learner', true, NOW() - INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000014', 'elena.learner@learnsphere.dev', '$2a$12$OwtyhCV33Li.ydxT82lbI.Zl6EegdQwscRJs/o5L1RkxYpWRuly/m', 'learner', true, NOW() - INTERVAL '25 days'),
('00000000-0000-0000-0000-000000000015', 'marcus.learner@learnsphere.dev', '$2a$12$OwtyhCV33Li.ydxT82lbI.Zl6EegdQwscRJs/o5L1RkxYpWRuly/m', 'learner', true, NOW() - INTERVAL '20 days'),
('00000000-0000-0000-0000-000000000016', 'sophia.learner@learnsphere.dev', '$2a$12$OwtyhCV33Li.ydxT82lbI.Zl6EegdQwscRJs/o5L1RkxYpWRuly/m', 'learner', true, NOW() - INTERVAL '15 days');

-- 3. PROFILES
INSERT INTO profiles (user_id, display_name, bio, language, timezone, theme) VALUES
('00000000-0000-0000-0000-000000000001', 'System Administrator', 'LearnSphere platform director managing global educational operations.', 'en', 'America/New_York', 'light'),
('00000000-0000-0000-0000-000000000002', 'Dr. Sarah Jenkins', 'Senior Full-Stack Engineer and instructor specializing in React, TypeScript, and distributed client architectures.', 'en', 'America/Los_Angeles', 'light'),
('00000000-0000-0000-0000-000000000003', 'David Martinez', 'Staff Infrastructure Architect with 12+ years optimizing relational databases and cloud microservices.', 'en', 'America/Chicago', 'light'),
('00000000-0000-0000-0000-000000000011', 'Alex Rivera', 'Curious developer advancing from junior frontend to full-stack engineering.', 'en', 'America/New_York', 'light'),
('00000000-0000-0000-0000-000000000012', 'Maya Chen', 'Computer Science student focusing on web frameworks and modern database design.', 'en', 'America/Los_Angeles', 'light'),
('00000000-0000-0000-0000-000000000013', 'Liam O''Connor', 'Aspiring software engineer exploring cloud development and backend systems.', 'en', 'Europe/Dublin', 'light'),
('00000000-0000-0000-0000-000000000014', 'Elena Rostova', 'Product designer learning frontend engineering to bridge code and interface design.', 'en', 'Europe/Berlin', 'light'),
('00000000-0000-0000-0000-000000000015', 'Marcus Vance', 'Backend developer expanding skills into database query optimization and PostgreSQL.', 'en', 'America/Chicago', 'light'),
('00000000-0000-0000-0000-000000000016', 'Sophia Al-Mansoor', 'Self-taught programmer embarking on the web development fundamentals path.', 'en', 'Asia/Dubai', 'light');

-- 4. TAGS
INSERT INTO tags (id, name, slug) VALUES
('20000000-0000-0000-0000-000000000001', 'Web Development', 'web-development'),
('20000000-0000-0000-0000-000000000002', 'React', 'react'),
('20000000-0000-0000-0000-000000000003', 'TypeScript', 'typescript'),
('20000000-0000-0000-0000-000000000004', 'PostgreSQL', 'postgresql'),
('20000000-0000-0000-0000-000000000005', 'Node.js', 'nodejs'),
('20000000-0000-0000-0000-000000000006', 'Database Design', 'database-design'),
('20000000-0000-0000-0000-000000000007', 'Cloud & DevOps', 'cloud-devops'),
('20000000-0000-0000-0000-000000000008', 'Docker', 'docker'),
('20000000-0000-0000-0000-000000000009', 'Algorithms', 'algorithms'),
('20000000-0000-0000-0000-000000000010', 'System Design', 'system-design'),
('20000000-0000-0000-0000-000000000011', 'CSS & Styling', 'css-styling'),
('20000000-0000-0000-0000-000000000012', 'Frontend Architecture', 'frontend-architecture');

-- 5. COURSES (8 courses: 6 published, 1 draft, 1 archived)
INSERT INTO courses (id, title, slug, short_description, description, instructor_id, status, level, estimated_minutes, view_count, created_at, published_at) VALUES
('10000000-0000-0000-0000-000000000001', 'Modern Full-Stack React & TypeScript', 'modern-full-stack-react-typescript', 'Master scalable frontend architecture with React 18, strict TypeScript, and production patterns.', 'A comprehensive deep dive into enterprise-ready React applications. You will learn modern hooks, strict TypeScript generic patterns, efficient component decomposition, and asynchronous state synchronization with real backend APIs.', '00000000-0000-0000-0000-000000000002', 'published', 'intermediate', 180, 1420, NOW() - INTERVAL '50 days', NOW() - INTERVAL '48 days'),
('10000000-0000-0000-0000-000000000002', 'PostgreSQL for Production Applications', 'postgresql-for-production-applications', 'From schema migrations to advanced indexing, query tuning, and ACID transactions.', 'Learn relational database design from the ground up for high-traffic services. Covers normalization, primary key strategies (UUIDs vs BigInt), compound indexes, EXPLAIN ANALYZE interpretation, row-level locking, and transaction isolation levels.', '00000000-0000-0000-0000-000000000003', 'published', 'intermediate', 210, 980, NOW() - INTERVAL '45 days', NOW() - INTERVAL '42 days'),
('10000000-0000-0000-0000-000000000003', 'Web Development & Modern CSS Mastery', 'web-development-modern-css-mastery', 'Build accessible, responsive, and aesthetically stunning modern web layouts.', 'Understand the fundamental building blocks of modern user interfaces. Explore semantic HTML5, CSS Grid, Flexbox, responsive typography, modern color systems (HSL/OKLCH), micro-interactions, and Web Accessibility (WCAG 2.1 AA) compliance.', '00000000-0000-0000-0000-000000000002', 'published', 'beginner', 120, 2150, NOW() - INTERVAL '40 days', NOW() - INTERVAL '38 days'),
('10000000-0000-0000-0000-000000000004', 'Cloud Architecture & Containerization with Docker', 'cloud-architecture-containerization-docker', 'Containerize microservices, manage multi-stage builds, and orchestrate environments.', 'Learn container virtualization essentials. Discover how to write lean Dockerfiles, configure multi-container compositions with Docker Compose, manage volume persistence, and prepare reproducible container images for cloud orchestration.', '00000000-0000-0000-0000-000000000003', 'published', 'advanced', 240, 760, NOW() - INTERVAL '35 days', NOW() - INTERVAL '32 days'),
('10000000-0000-0000-0000-000000000005', 'Data Structures & Algorithms in TypeScript', 'data-structures-algorithms-typescript', 'Essential CS fundamentals implemented with strongly-typed TypeScript and complexity analysis.', 'Strengthen your problem-solving foundations with clear, typed implementations of Arrays, Hash Maps, Linked Lists, Trees, Graphs, Sorting, and Dynamic Programming. Each module covers Big-O time and space trade-offs in depth.', '00000000-0000-0000-0000-000000000002', 'published', 'intermediate', 190, 890, NOW() - INTERVAL '30 days', NOW() - INTERVAL '28 days'),
('10000000-0000-0000-0000-000000000006', 'System Design for High-Scale Web Services', 'system-design-for-high-scale-web-services', 'Design fault-tolerant distributed systems handling millions of concurrent operations.', 'Explore real-world distributed architectures: load balancers, caching hierarchies (Redis/CDN), database sharding, asynchronous messaging queues, rate limiting, and CAP theorem trade-offs for reliable microservices.', '00000000-0000-0000-0000-000000000003', 'published', 'advanced', 300, 1120, NOW() - INTERVAL '25 days', NOW() - INTERVAL '22 days'),
('10000000-0000-0000-0000-000000000007', 'Advanced State Management Patterns', 'advanced-state-management-patterns', 'Explore Context, Redux Toolkit, Zustand, and atomic state design.', 'An in-depth look at comparing modern state management paradigms for large web apps. Discover performance implications of selective re-rendering, middleware side-effects, and server state caching.', '00000000-0000-0000-0000-000000000002', 'draft', 'intermediate', 150, 45, NOW() - INTERVAL '10 days', NULL),
('10000000-0000-0000-0000-000000000008', 'Legacy Monolithic Architectures & Migration', 'legacy-monolithic-architectures-migration', 'Strategies for refactoring monolithic legacy codebases to modular services.', 'Retrospective study on anti-patterns, circular dependencies, and the Strangler Fig pattern for incrementally decoupling legacy systems.', '00000000-0000-0000-0000-000000000003', 'archived', 'advanced', 160, 310, NOW() - INTERVAL '60 days', NOW() - INTERVAL '58 days');

-- 6. COURSE_TAGS
INSERT INTO course_tags (course_id, tag_id) VALUES
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002'),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000012'),

('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004'),
('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000005'),
('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006'),

('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000011'),

('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000007'),
('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000008'),

('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000003'),
('10000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000009'),

('10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000007'),
('10000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000010');

-- 7. LESSONS
-- Course 1: React & TypeScript (6 lessons)
INSERT INTO lessons (id, course_id, title, description, type, position, is_required, duration_seconds, text_content) VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Introduction to React 18 & TypeScript Tooling', 'Setting up Vite, TSConfig strict flags, and understanding React 18 concurrent features.', 'video', 1, true, 1200, 'In this lesson, we explore how React 18 concurrent rendering operates alongside strict TypeScript type-checking. We will configure Vite with optimal path aliases and strict compiler options.'),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Component Decomposition & Pure Typing', 'Best practices for prop typing, generic components, and avoiding any.', 'document', 2, true, 900, '### Component Decomposition Principles\n\nWhen writing React components with TypeScript, type inference should be prioritized over explicit verbose typing where possible.\n\n```tsx\ninterface CardProps<T> {\n  data: T;\n  renderItem: (item: T) => React.ReactNode;\n}\n```\n\nAlways ensure props are readonly to maintain functional purity across render cycles.'),
('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'State Management & Custom Hooks Architecture', 'Building reusable hooks for network status, debounce, and local storage.', 'video', 3, true, 1500, 'Custom hooks allow encapsulating stateful business logic away from visual presentation components. In this video, we build `useDebounce`, `useLocalStorage`, and `useAsyncQuery`.'),
('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Architecture Overview Diagram', 'Visual diagram representing unidirectional data flow and boundary layers.', 'image', 4, true, 300, 'Review the architecture diagram below illustrating the flow between UI components, feature stores, and API clients.'),
('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'Performance Optimization & Memoization Tactics', 'When to use useMemo, useCallback, and React.memo without premature optimization.', 'document', 5, true, 1100, '### When to Memoize\n\nMemoization is not free; it carries memory overhead and identity comparison cost. Only memoize when passing callbacks to optimized children or calculating expensive derived data.'),
('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'React & TypeScript Mastery Knowledge Check', 'Comprehensive quiz validating your understanding of React 18 and TypeScript patterns.', 'quiz', 6, true, 1200, 'Test your knowledge on React hooks, generics, and concurrent mode behavior.');

-- Course 2: PostgreSQL for Production (5 lessons)
INSERT INTO lessons (id, course_id, title, description, type, position, is_required, duration_seconds, text_content) VALUES
('30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'Relational Schema Design & Primary Key Trade-Offs', 'Comparing UUIDv4, UUIDv7, and BigInt sequences in distributed systems.', 'video', 1, true, 1400, 'Detailed evaluation of primary key strategies in PostgreSQL. Learn why UUIDs eliminate sequence collisions in multi-master setups while understanding B-Tree index fragmentation mitigations.'),
('30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 'Indexing Strategies: B-Tree, GIN, and Partial Indexes', 'How to choose the correct index type for specific query patterns.', 'document', 2, true, 1000, '### PostgreSQL Indexing Essentials\n\n- **B-Tree**: Default index, optimal for equality and range queries (`<`, `<=`, `=`, `>=`, `>`).\n- **GIN (Generalized Inverted Index)**: Essential for full-text search, arrays, and JSONB keys.\n- **Partial Index**: An index with a `WHERE` clause to minimize index footprint.'),
('30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', 'Query Optimization with EXPLAIN ANALYZE', 'Reading execution plans, detecting sequential scans, and fixing slow queries.', 'video', 3, true, 1600, 'Walk through real EXPLAIN ANALYZE traces, understanding cost estimates, actual execution rows, buffer hits, and nested loop vs hash joins.'),
('30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', 'Transactions, Isolation Levels & Concurrency Control', 'Read Committed vs Repeatable Read vs Serializable and row-level locking.', 'document', 4, true, 1200, 'PostgreSQL uses Multiversion Concurrency Control (MVCC). We study phantom reads, non-repeatable reads, and serialization anomalies along with `SELECT ... FOR UPDATE`.'),
('30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000002', 'PostgreSQL Production Essentials Quiz', 'Assess your knowledge on schemas, transactions, and index tuning.', 'quiz', 5, true, 900, 'Validate your understanding of database indexing, transactions, and query plans.');

-- Course 3: Web Dev & CSS Mastery (5 lessons)
INSERT INTO lessons (id, course_id, title, description, type, position, is_required, duration_seconds, text_content) VALUES
('30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000003', 'Semantic HTML5 & Accessibility Foundations', 'Semantic elements, screen reader testing, and landmark roles.', 'document', 1, true, 800, 'Accessible markup is the bedrock of usable web apps. Never replace `<button>` with a clickable `<div>`. Learn landmark tags: `<main>`, `<nav>`, `<header>`, and `<section>`.'),
('30000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000003', 'Modern CSS Grid & Flexbox in Practice', 'Building two-dimensional responsive layouts without fragile media queries.', 'video', 2, true, 1300, 'Hands-on layout construction using CSS Grid `repeat(auto-fit, minmax(280px, 1fr))` and Flexbox alignment for UI headers and cards.'),
('30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000003', 'Fluid Typography & Color Tokens', 'Using clamp() for scalable font sizing and modern color spaces.', 'document', 3, true, 700, 'Use CSS custom properties for cohesive themes. `font-size: clamp(1rem, 2.5vw, 2.5rem);` ensures smooth typography scaling across viewport widths.'),
('30000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000003', 'Visual Hierarchy Design Guide', 'Infographic illustrating typographic contrast, whitespace rhythm, and focal hierarchy.', 'image', 4, true, 400, 'Explore the visual hierarchy guidelines illustrating proper negative space, typography scaling, and button weight balance.'),
('30000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000003', 'Modern Web Standards & CSS Quiz', 'Quiz on HTML5 semantics, CSS Grid/Flexbox, and accessibility standards.', 'quiz', 5, true, 900, 'Verify your grasp of modern layout techniques and accessibility requirements.');

-- Course 4: Docker & Cloud (5 lessons)
INSERT INTO lessons (id, course_id, title, description, type, position, is_required, duration_seconds, text_content) VALUES
('30000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000004', 'Container Fundamentals & Namespaces', 'How Linux cgroups and namespaces provide process isolation.', 'video', 1, true, 1500, 'Demystifying container technology: processes, file systems, namespaces, and resource control.'),
('30000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000004', 'Writing Production-Grade Multi-Stage Dockerfiles', 'Minimizing image size and improving layer cache efficiency.', 'document', 2, true, 1100, 'Learn how multi-stage builds separate development dependencies from runtime artifacts, producing minimal scratch or alpine images.'),
('30000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000004', 'Docker Compose for Local Microservices', 'Defining networks, volume mounts, and service dependencies.', 'video', 3, true, 1400, 'Orchestrate API servers, PostgreSQL, and Redis in local developer environments with clean Docker Compose specifications.'),
('30000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000004', 'Healthchecks, Logging & Security Hardening', 'Running non-root users, read-only filesystems, and healthcheck probes.', 'document', 4, true, 900, 'Security best practices for production container runtime configurations.'),
('30000000-0000-0000-0000-000000000035', '10000000-0000-0000-0000-000000000004', 'Container Networking & Architecture Diagram', 'Visual diagram of bridge networks and ingress gateways.', 'image', 5, true, 500, 'Architectural diagram illustrating Docker host port mappings and internal bridge networks.');

-- Course 5: Data Structures in TypeScript (5 lessons)
INSERT INTO lessons (id, course_id, title, description, type, position, is_required, duration_seconds, text_content) VALUES
('30000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000005', 'Asymptotic Notation & Time Complexity', 'Big-O, Big-Theta, and Big-Omega with practical code benchmarks.', 'document', 1, true, 1000, 'Learn how to accurately evaluate algorithms based on input size scaling and memory usage.'),
('30000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000005', 'Linked Lists & Hash Map Collision Strategies', 'Separate chaining and open addressing implemented in TypeScript.', 'video', 2, true, 1600, 'Writing custom Linked List classes and implementing bucket hash tables with hash functions.'),
('30000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000005', 'Binary Search Trees & AVL Balancing', 'Tree traversals (in-order, pre-order, post-order) and rotation logic.', 'document', 3, true, 1200, 'Detailed TypeScript implementation of binary search trees with recursive traversal methods.'),
('30000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000005', 'Graph Traversals: BFS & DFS in Practice', 'Breadth-First and Depth-First search with adjacency lists.', 'video', 4, true, 1500, 'Shortest-path algorithms, topological sorting, and cycle detection in directed graphs.'),
('30000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000005', 'Dynamic Programming Fundamentals', 'Memoization vs tabulation through real optimization problems.', 'document', 5, true, 1100, 'Breaking complex problems down into overlapping subproblems with optimal substructure.');

-- Course 6: System Design (5 lessons)
INSERT INTO lessons (id, course_id, title, description, type, position, is_required, duration_seconds, text_content) VALUES
('30000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000006', 'High Availability & Scalability Principles', 'Horizontal vs vertical scaling, failure domains, and SLA calculations.', 'video', 1, true, 1800, 'Core tenets of designing distributed services without single points of failure.'),
('30000000-0000-0000-0000-000000000052', '10000000-0000-0000-0000-000000000006', 'Caching Strategies & Invalidation Patterns', 'Cache-aside, write-through, and cache stampede protection.', 'document', 2, true, 1300, 'Strategies for maximizing hit rates and ensuring cache coherence across distributed nodes.'),
('30000000-0000-0000-0000-000000000053', '10000000-0000-0000-0000-000000000006', 'Database Sharding & Consistent Hashing', 'Partitioning large datasets and managing ring topologies.', 'video', 3, true, 1900, 'Virtual nodes, hash rings, and data rebalancing during node joins and failures.'),
('30000000-0000-0000-0000-000000000054', '10000000-0000-0000-0000-000000000006', 'Asynchronous Processing with Message Brokers', 'Comparing event-driven patterns with message queues and streaming logs.', 'document', 4, true, 1200, 'Decoupling compute-heavy workflows via message producers and consumer pools.'),
('30000000-0000-0000-0000-000000000055', '10000000-0000-0000-0000-000000000006', 'Global Distributed System Architecture Map', 'High-level topology showing multi-region deployment, CDN edges, and database clusters.', 'image', 5, true, 600, 'System design blueprint showcasing edge nodes, load balancers, and replicated clusters.');

-- 8. QUIZZES (3 complete quizzes)
-- Quiz 1 for Lesson 30000000-0000-0000-0000-000000000006 (React & TS)
INSERT INTO quizzes (id, lesson_id, title, instructions, passing_score, max_attempts) VALUES
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 'React 18 & TypeScript Knowledge Check', 'Answer all 4 questions. You need at least 70% to pass this quiz.', 70.00, 3);

-- Quiz 1 Questions
INSERT INTO quiz_questions (id, quiz_id, question_text, position, points) VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'What is the primary benefit of React 18 Concurrent Features like useTransition?', 1, 1),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Which TypeScript utility type makes all properties of an interface optional?', 2, 1),
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', 'Why should you avoid storing JWT access tokens in browser localStorage?', 3, 1),
('50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000001', 'When should React.memo be used on a component?', 4, 1);

-- Quiz 1 Options
INSERT INTO quiz_options (id, question_id, option_text, position, is_correct) VALUES
-- Q1
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'It keeps the interface responsive by marking non-urgent state updates as interruptible', 1, true),
('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'It automatically compiles React components into native WebAssembly code', 2, false),
('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 'It replaces the need for any backend caching layer', 3, false),
('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000001', 'It forces synchronous rendering across all components', 4, false),
-- Q2
('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000002', 'Partial<T>', 1, true),
('60000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000002', 'Required<T>', 2, false),
('60000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000002', 'Readonly<T>', 3, false),
('60000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000002', 'Pick<T, K>', 4, false),
-- Q3
('60000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000003', 'It is accessible by any JavaScript running in the page, making it vulnerable to XSS theft', 1, true),
('60000000-0000-0000-0000-000000000010', '50000000-0000-0000-0000-000000000003', 'LocalStorage is limited to 100 bytes of storage', 2, false),
('60000000-0000-0000-0000-000000000011', '50000000-0000-0000-0000-000000000003', 'LocalStorage automatically deletes keys when the browser tab closes', 3, false),
('60000000-0000-0000-0000-000000000012', '50000000-0000-0000-0000-000000000003', 'PostgreSQL cannot validate tokens originating from localStorage', 4, false),
-- Q4
('60000000-0000-0000-0000-000000000013', '50000000-0000-0000-0000-000000000004', 'When a component renders often with identical props and has measurable render cost', 1, true),
('60000000-0000-0000-0000-000000000014', '50000000-0000-0000-0000-000000000004', 'On every single component in the codebase by default', 2, false),
('60000000-0000-0000-0000-000000000015', '50000000-0000-0000-0000-000000000004', 'Only when using class components', 3, false),
('60000000-0000-0000-0000-000000000016', '50000000-0000-0000-0000-000000000004', 'To prevent components from ever unmounting', 4, false);

-- Quiz 2 for Lesson 30000000-0000-0000-0000-000000000015 (PostgreSQL)
INSERT INTO quizzes (id, lesson_id, title, instructions, passing_score, max_attempts) VALUES
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000015', 'PostgreSQL Production Essentials Quiz', 'Test your knowledge on indexes, transactions, and relational database integrity.', 75.00, 3);

-- Quiz 2 Questions
INSERT INTO quiz_questions (id, quiz_id, question_text, position, points) VALUES
('50000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000002', 'Which index type is best suited for full-text search and JSONB query operations in PostgreSQL?', 1, 1),
('50000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000002', 'What does the ACID "I" stand for in database transaction properties?', 2, 1),
('50000000-0000-0000-0000-000000000013', '40000000-0000-0000-0000-000000000002', 'What does EXPLAIN ANALYZE do differently compared to plain EXPLAIN?', 3, 1);

-- Quiz 2 Options
INSERT INTO quiz_options (id, question_id, option_text, position, is_correct) VALUES
-- Q1
('60000000-0000-0000-0000-000000000021', '50000000-0000-0000-0000-000000000011', 'GIN (Generalized Inverted Index)', 1, true),
('60000000-0000-0000-0000-000000000022', '50000000-0000-0000-0000-000000000011', 'Hash Index', 2, false),
('60000000-0000-0000-0000-000000000023', '50000000-0000-0000-0000-000000000011', 'BRIN Index', 3, false),
('60000000-0000-0000-0000-000000000024', '50000000-0000-0000-0000-000000000011', 'Sp-GiST Index', 4, false),
-- Q2
('60000000-0000-0000-0000-000000000025', '50000000-0000-0000-0000-000000000012', 'Isolation', 1, true),
('60000000-0000-0000-0000-000000000026', '50000000-0000-0000-0000-000000000012', 'Idempotency', 2, false),
('60000000-0000-0000-0000-000000000027', '50000000-0000-0000-0000-000000000012', 'Integrity', 3, false),
('60000000-0000-0000-0000-000000000028', '50000000-0000-0000-0000-000000000012', 'Indexing', 4, false),
-- Q3
('60000000-0000-0000-0000-000000000029', '50000000-0000-0000-0000-000000000013', 'It actually executes the query to report real runtime metrics, rather than just estimating', 1, true),
('60000000-0000-0000-0000-000000000030', '50000000-0000-0000-0000-000000000013', 'It automatically adds indexes to fix slow parts of the query', 2, false),
('60000000-0000-0000-0000-000000000031', '50000000-0000-0000-0000-000000000013', 'It exports the query results directly to a CSV file', 3, false),
('60000000-0000-0000-0000-000000000032', '50000000-0000-0000-0000-000000000013', 'It runs in a separate test database', 4, false);

-- Quiz 3 for Lesson 30000000-0000-0000-0000-000000000025 (Web Dev & CSS)
INSERT INTO quizzes (id, lesson_id, title, instructions, passing_score, max_attempts) VALUES
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000025', 'Modern Web Standards & Accessibility Quiz', 'Validate your understanding of accessible HTML5 and responsive styling.', 70.00, 3);

-- Quiz 3 Questions
INSERT INTO quiz_questions (id, quiz_id, question_text, position, points) VALUES
('50000000-0000-0000-0000-000000000021', '40000000-0000-0000-0000-000000000003', 'Which HTML element should represent the main content area of a document, appearing once per page?', 1, 1),
('50000000-0000-0000-0000-000000000022', '40000000-0000-0000-0000-000000000003', 'What CSS layout property defines a flexible two-dimensional grid system?', 2, 1),
('50000000-0000-0000-0000-000000000023', '40000000-0000-0000-0000-000000000003', 'What is the WCAG 2.1 AA minimum contrast ratio for normal body text against its background?', 3, 1);

-- Quiz 3 Options
INSERT INTO quiz_options (id, question_id, option_text, position, is_correct) VALUES
-- Q1
('60000000-0000-0000-0000-000000000041', '50000000-0000-0000-0000-000000000021', '<main>', 1, true),
('60000000-0000-0000-0000-000000000042', '50000000-0000-0000-0000-000000000021', '<section id="main">', 2, false),
('60000000-0000-0000-0000-000000000043', '50000000-0000-0000-0000-000000000021', '<div role="content">', 3, false),
('60000000-0000-0000-0000-000000000044', '50000000-0000-0000-0000-000000000021', '<article>', 4, false),
-- Q2
('60000000-0000-0000-0000-000000000045', '50000000-0000-0000-0000-000000000022', 'display: grid', 1, true),
('60000000-0000-0000-0000-000000000046', '50000000-0000-0000-0000-000000000022', 'display: flex', 2, false),
('60000000-0000-0000-0000-000000000047', '50000000-0000-0000-0000-000000000022', 'display: block', 3, false),
('60000000-0000-0000-0000-000000000048', '50000000-0000-0000-0000-000000000022', 'display: inline-block', 4, false),
-- Q3
('60000000-0000-0000-0000-000000000049', '50000000-0000-0000-0000-000000000023', '4.5:1', 1, true),
('60000000-0000-0000-0000-000000000050', '50000000-0000-0000-0000-000000000023', '3:1', 2, false),
('60000000-0000-0000-0000-000000000051', '50000000-0000-0000-0000-000000000023', '7:1', 3, false),
('60000000-0000-0000-0000-000000000052', '50000000-0000-0000-0000-000000000023', '2:1', 4, false);

-- 9. ENROLLMENTS
INSERT INTO enrollments (id, user_id, course_id, status, enrolled_at, started_at, completed_at) VALUES
-- Alex: Completed Course 1, In Progress Course 2, Completed Course 3
('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '29 days', NOW() - INTERVAL '10 days'),
('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'in_progress', NOW() - INTERVAL '20 days', NOW() - INTERVAL '18 days', NULL),
('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000003', 'completed', NOW() - INTERVAL '28 days', NOW() - INTERVAL '27 days', NOW() - INTERVAL '15 days'),

-- Maya: In Progress Course 1, Enrolled Course 4
('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 'in_progress', NOW() - INTERVAL '14 days', NOW() - INTERVAL '12 days', NULL),
('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004', 'enrolled', NOW() - INTERVAL '5 days', NULL, NULL),

-- Liam: In Progress Course 2, In Progress Course 5
('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', 'in_progress', NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', NULL),
('70000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000005', 'in_progress', NOW() - INTERVAL '8 days', NOW() - INTERVAL '7 days', NULL),

-- Elena: Enrolled Course 3
('70000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', 'enrolled', NOW() - INTERVAL '4 days', NULL, NULL),

-- Marcus: In Progress Course 1
('70000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001', 'in_progress', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NULL),

-- Sophia: In Progress Course 3
('70000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000003', 'in_progress', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NULL);

-- 10. LESSON_PROGRESS
-- Alex: Completed all 6 lessons of Course 1
INSERT INTO lesson_progress (user_id, enrollment_id, lesson_id, progress_percent, current_position_seconds, status, started_at, completed_at) VALUES
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 100.00, 1200, 'completed', NOW() - INTERVAL '29 days', NOW() - INTERVAL '29 days'),
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', 100.00, 900, 'completed', NOW() - INTERVAL '25 days', NOW() - INTERVAL '25 days'),
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 100.00, 1500, 'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004', 100.00, 300, 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', 100.00, 1100, 'completed', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', 100.00, 1200, 'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

-- Alex: In progress on Course 2 (2 completed, 1 in progress)
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000011', 100.00, 1400, 'completed', NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days'),
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000012', 100.00, 1000, 'completed', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days'),
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000013', 55.00, 880, 'in_progress', NOW() - INTERVAL '2 days', NULL),

-- Alex: Completed Course 3 (all 5 lessons)
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000021', 100.00, 800, 'completed', NOW() - INTERVAL '27 days', NOW() - INTERVAL '27 days'),
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000022', 100.00, 1300, 'completed', NOW() - INTERVAL '22 days', NOW() - INTERVAL '22 days'),
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000023', 100.00, 700, 'completed', NOW() - INTERVAL '19 days', NOW() - INTERVAL '19 days'),
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000024', 100.00, 400, 'completed', NOW() - INTERVAL '16 days', NOW() - INTERVAL '16 days'),
('00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000025', 100.00, 900, 'completed', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days'),

-- Maya: In progress Course 1 (2 completed)
('00000000-0000-0000-0000-000000000012', '70000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', 100.00, 1200, 'completed', NOW() - INTERVAL '12 days', NOW() - INTERVAL '12 days'),
('00000000-0000-0000-0000-000000000012', '70000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', 100.00, 900, 'completed', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days');

-- 11. QUIZ ATTEMPTS & ANSWERS
-- Alex attempt on Quiz 1 (React): Passed with 100%
INSERT INTO quiz_attempts (id, quiz_id, user_id, enrollment_id, attempt_number, score, max_score, percentage, passed, started_at, submitted_at) VALUES
('80000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000001', 1, 4.00, 4.00, 100.00, true, NOW() - INTERVAL '10 days' - INTERVAL '15 minutes', NOW() - INTERVAL '10 days');

INSERT INTO quiz_answers (attempt_id, question_id, selected_option_id, is_correct, points_awarded) VALUES
('80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', true, 1.00),
('80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000005', true, 1.00),
('80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000009', true, 1.00),
('80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000013', true, 1.00);

-- Alex attempt on Quiz 3 (Web Standards): Passed with 100%
INSERT INTO quiz_attempts (id, quiz_id, user_id, enrollment_id, attempt_number, score, max_score, percentage, passed, started_at, submitted_at) VALUES
('80000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', '70000000-0000-0000-0000-000000000003', 1, 3.00, 3.00, 100.00, true, NOW() - INTERVAL '15 days' - INTERVAL '10 minutes', NOW() - INTERVAL '15 days');

INSERT INTO quiz_answers (attempt_id, question_id, selected_option_id, is_correct, points_awarded) VALUES
('80000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000021', '60000000-0000-0000-0000-000000000041', true, 1.00),
('80000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000022', '60000000-0000-0000-0000-000000000045', true, 1.00),
('80000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000023', '60000000-0000-0000-0000-000000000049', true, 1.00);

-- 12. GAMIFICATION (Achievements, Badges, Point Transactions)
INSERT INTO achievements (id, code, name, description, icon, criteria_type, criteria_value, points_reward, is_active) VALUES
('90000000-0000-0000-0000-000000000001', 'first_enrollment', 'First Step', 'Enrolled in your first course on LearnSphere.', '🎯', 'first_enrollment', 1, 50, true),
('90000000-0000-0000-0000-000000000002', 'first_completion', 'Milestone Reached', 'Successfully completed your first course.', '🎓', 'first_completion', 1, 200, true),
('90000000-0000-0000-0000-000000000003', 'quiz_whiz', 'Quiz Ace', 'Passed a quiz with a perfect 100% score.', '⚡', 'quizzes_passed', 1, 100, true),
('90000000-0000-0000-0000-000000000004', 'streak_7', 'Week of Dedication', 'Maintained a 7-day learning streak.', '🔥', 'streak_days', 7, 150, true),
('90000000-0000-0000-0000-000000000005', 'courses_3', 'Scholar', 'Completed three full courses.', '📚', 'courses_completed', 3, 500, true);

INSERT INTO badges (id, code, name, description, level, criteria_type, criteria_value, icon) VALUES
('90000000-0000-0000-0000-000000000011', 'pioneer_badge', 'Pioneer Learner', 'One of the founding learners of the platform.', 'bronze', 'first_enrollment', 1, '🥉'),
('90000000-0000-0000-0000-000000000012', 'silver_scholar', 'Silver Scholar', 'Completed multiple learning tracks with high distinction.', 'silver', 'courses_completed', 2, '🥈'),
('90000000-0000-0000-0000-000000000013', 'gold_architect', 'Gold Architect', 'Mastered full-stack development and backend design.', 'gold', 'courses_completed', 5, '🥇');

-- Grant achievements to Alex
INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES
('00000000-0000-0000-0000-000000000011', '90000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000011', '90000000-0000-0000-0000-000000000002', NOW() - INTERVAL '15 days'),
('00000000-0000-0000-0000-000000000011', '90000000-0000-0000-0000-000000000003', NOW() - INTERVAL '10 days'),
('00000000-0000-0000-0000-000000000011', '90000000-0000-0000-0000-000000000004', NOW() - INTERVAL '5 days');

-- Grant badges to Alex
INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES
('00000000-0000-0000-0000-000000000011', '90000000-0000-0000-0000-000000000011', NOW() - INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000011', '90000000-0000-0000-0000-000000000012', NOW() - INTERVAL '10 days');

-- Grant first_enrollment to Maya
INSERT INTO user_achievements (user_id, achievement_id, earned_at) VALUES
('00000000-0000-0000-0000-000000000012', '90000000-0000-0000-0000-000000000001', NOW() - INTERVAL '14 days');

-- Point transactions (matching achievements and completions)
INSERT INTO point_transactions (user_id, source_type, source_id, points, description, created_at) VALUES
('00000000-0000-0000-0000-000000000011', 'first_enrollment', '10000000-0000-0000-0000-000000000001', 50, 'Enrolled in Modern Full-Stack React & TypeScript', NOW() - INTERVAL '30 days'),
('00000000-0000-0000-0000-000000000011', 'course_complete', '10000000-0000-0000-0000-000000000003', 200, 'Completed Web Development & Modern CSS Mastery', NOW() - INTERVAL '15 days'),
('00000000-0000-0000-0000-000000000011', 'course_complete', '10000000-0000-0000-0000-000000000001', 200, 'Completed Modern Full-Stack React & TypeScript', NOW() - INTERVAL '10 days'),
('00000000-0000-0000-0000-000000000011', 'quiz_pass', '40000000-0000-0000-0000-000000000001', 100, 'Passed React 18 & TypeScript Knowledge Check with 100%', NOW() - INTERVAL '10 days'),
('00000000-0000-0000-0000-000000000011', 'streak_bonus', '90000000-0000-0000-0000-000000000004', 150, 'Achieved 7-day learning streak bonus', NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000012', 'first_enrollment', '10000000-0000-0000-0000-000000000001', 50, 'Enrolled in Modern Full-Stack React & TypeScript', NOW() - INTERVAL '14 days');

-- 13. LEARNING ACTIVITY (Last 14 days for active streak tracking)
INSERT INTO learning_activity (user_id, activity_date, activity_type, source_id, created_at) VALUES
('00000000-0000-0000-0000-000000000011', CURRENT_DATE - 7, 'lesson_completed', '30000000-0000-0000-0000-000000000011', NOW() - INTERVAL '7 days'),
('00000000-0000-0000-0000-000000000011', CURRENT_DATE - 6, 'lesson_viewed', '30000000-0000-0000-0000-000000000012', NOW() - INTERVAL '6 days'),
('00000000-0000-0000-0000-000000000011', CURRENT_DATE - 5, 'lesson_completed', '30000000-0000-0000-0000-000000000012', NOW() - INTERVAL '5 days'),
('00000000-0000-0000-0000-000000000011', CURRENT_DATE - 4, 'lesson_viewed', '30000000-0000-0000-0000-000000000013', NOW() - INTERVAL '4 days'),
('00000000-0000-0000-0000-000000000011', CURRENT_DATE - 3, 'lesson_viewed', '30000000-0000-0000-0000-000000000013', NOW() - INTERVAL '3 days'),
('00000000-0000-0000-0000-000000000011', CURRENT_DATE - 2, 'lesson_viewed', '30000000-0000-0000-0000-000000000013', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000011', CURRENT_DATE - 1, 'lesson_viewed', '30000000-0000-0000-0000-000000000013', NOW() - INTERVAL '1 days'),
('00000000-0000-0000-0000-000000000011', CURRENT_DATE,     'lesson_viewed', '30000000-0000-0000-0000-000000000013', NOW());

-- 14. COURSE VIEWS
INSERT INTO course_views (course_id, user_id, viewed_at) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', NOW() - INTERVAL '15 days'),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000012', NOW() - INTERVAL '14 days'),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000011', NOW() - INTERVAL '10 days'),
('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', NOW() - INTERVAL '20 days');
