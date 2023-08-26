-- CREATE DATABASE sql_bolt;
CREATE TABLE "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX "IDX_session_expire" ON "session" ("expire");

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USER TABLE
CREATE TABLE bolt_user (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(25) NOT NULL,
    email VARCHAR(25),
    password text UNIQUE NOT NULL
);

-- SUBJECT TABLE
CREATE TABLE subject (
    id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(25) NOT NULL
);

-- TASK TABLE
CREATE TABLE task (
    id BIGSERIAL NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    createdat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed BOOLEAN NOT NULL DEFAULT false,
    details text,
    parent_id BIGINT,
    user_id UUID NOT NULL,
    subject_id UUID,
    duedate DATE NOT NULL,
    duetime TIMESTAMP,
    task_order INT,
    completed_order INT,
    CONSTRAINT fk_parent
      FOREIGN KEY(parent_id) 
	    REFERENCES task(id),
    CONSTRAINT fk_user
      FOREIGN KEY(user_id)
      REFERENCES bolt_user(id),
    CONSTRAINT fk_subject
      FOREIGN KEY(subject_id)
      REFERENCES subject(id)
);

-- adding order constraint to task_order and completed_order
ALTER TABLE task 
ADD CONSTRAINT order_constraint 
CHECK (
  task_order IS NOT NULL AND completed_order IS NULL OR 
  task_order IS NULL AND completed_order IS NOT NULL
);


----------------------------- FILL DATA -----------------------------

-- CREATE USER
INSERT INTO bolt_user (id, username, password)
VALUES ('1cae89eb-66d4-4780-a210-a0e548b81536', 'johndoe', '$2a$10$lrQgo/d93B9M2ARSDXfZPu5KWUUjG9FswScFWT6do9o08.nGqiFm6')

