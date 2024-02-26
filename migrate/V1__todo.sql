CREATE SCHEMA IF NOT EXISTS todo;

CREATE TABLE IF NOT EXISTS todo.Users
(
    firstName character varying(30) NOT NULL,
    lastName character varying(30) NOT NULL,
    middleName character varying(30),
    email character varying(50) NOT NULL UNIQUE,
    password character varying(200) NOT NULL,
    is_verified boolean DEFAULT FALSE,
    created_at timestamp,
    updated_at timestamp,
    id character varying(100) PRIMARY KEY
);


CREATE TABLE IF NOT EXISTS todo.Lists
(
    userId character varying(100) REFERENCES todo.Users(id) NOT NULL,
    name character varying(20) NOT NULL,
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW(),
    id character varying(100) PRIMARY KEY
);

CREATE TYPE todo.priority AS ENUM ('High', 'Medium', 'Low');


CREATE TABLE IF NOT EXISTS todo.States
(
    id character varying(100) PRIMARY KEY,
    state character varying(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS todo.Tasks
(
    listId character varying(100) REFERENCES todo.Lists(id) NOT NULL,
    summary character varying(50),
    task character varying(100) NOT NULL,
    dueDate timestamp NOT NULL,
    priority character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW(),
    id character varying(100) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS todo.Attachments
(
    taskId character varying(100) REFERENCES todo.Tasks(id) NOT NULL,
    attachedDate timestamp NOT NULL DEFAULT NOW(),
    path character varying(200),
    name character varying(50),
    size integer,
    id character varying(100) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS todo.Comments
(
    taskId character varying(100) REFERENCES todo.Tasks(id) NOT NULL,
    comment character varying(150),
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW(),
    id character varying(100) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS todo.Reminders
(
    taskId character varying(100) REFERENCES todo.Tasks(id) NOT NULL,
    reminderDate timestamp NOT NULL,
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW(),
    id character varying(100) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS todo.Tags
(
    userId character varying(100) REFERENCES todo.Users(id) NOT NULL,
    name character varying(50),
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW(),
    id character varying(100) PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS todo.TaskTags
(
    taskId character varying(100) REFERENCES todo.Tasks(id) NOT NULL,
    tagId character varying(100) REFERENCES todo.Tags(id) NOT NULL
);

