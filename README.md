# RAS Site Safety App

A small web application that emulates an internal site safety tool for construction teams.

Live application: https://ras-site-safety-app.vercel.app

## What is this app?

The app allows framers working on job sites to complete daily safety forms. Workers can report their current safety conditions, site conditions, and upload photos as part of their submission.

Administrators can review submissions across different sites and track which workers have or have not submitted their daily safety form.

## Tech Stack

* Frontend: React with Next.js
* Backend: Next.js API routes / server-side functionality
* Database: PostgreSQL
* ORM: Prisma
* Database hosting: Neon
* Authentication: Better Auth
* File storage: Vercel Blob
* Styling: Tailwind CSS
* Deployment: Vercel

## Running Locally

### 1. Install dependencies

`npm install`

### 2. Generate the Prisma client

`npx prisma generate`

### 3. Seed the database

`npx prisma db seed`

The seed script creates the users, sites, and other initial data needed to use the application.

### 4. Start the development server

`npm run dev`

The application will be available at http://localhost:3000.

### Database Schema Changes

If you make changes to prisma/schema.prisma, create a new migration:

`npx prisma migrate dev --name <migration-name>`

For example:

`npx prisma migrate dev --name add_submission_status`

## Test Accounts

The application is pre-seeded with the following test accounts.

Admin

* Name: John Doe
* Password: AdminPass123!

Framer

* Name: Dave Miller
* Password: Password123!

Framer

* Name: Alex Chen
* Password: Password123!

## Assumptions

This application was built as a technical assessment and focuses on the core functionality rather than a complete production-ready user management system.

* Users are assumed to already exist in the system.
* Authentication assumes users will enter valid credentials. Brute-force protection, such as temporary account lockouts or sign-in rate limiting after repeated failed attempts, is not implemented in this assessment version.
* The Framer experience is optimized for mobile devices, since framers are expected to complete safety forms from job sites using their phones.
* The Admin dashboard is primarily designed for desktop use because it contains more detailed tables, filters, and review functionality. It remains usable on smaller screens, but the mobile experience is not as optimized as the Framer interface.
* User creation and password reset are not currently implemented.
* The database should be seeded using prisma db seed to provide the users and data needed to access the application.
* The application has two user roles: Admin and Framer.
* A submission’s status indicates whether an administrator has reviewed the submission.
* Photos are stored using Vercel Blob, with their references stored in the database.
* The application is intended to demonstrate the workflow and functionality of an internal tool rather than serve as a production deployment.
* The application is designed with mobile use in mind, as framers may complete safety forms from an iPhone on a job site.
* Photos uploaded from devices using HEIC/HEIF format are supported and converted to JPEG before being stored. This provides compatibility with common iPhone image formats while keeping the stored image format consistent.

## Database Design
The database schema is represented in the attached ERD. The schema uses separate models for users, sites, photos and safety submissions, with submissions linked to both the worker and the site where the form was completed.

I chose fixed fields for the safety checklist rather than storing the checklist as a JSON object so that each safety condition can be queried and filtered independently. User accounts also use an active/inactive state so that users can be deactivated without removing their historical submissions.

## Admin

The Admin dashboard is only accessible to users with the Admin role.

The dashboard provides an overview of daily safety form activity, including:

* The number of workers who have submitted a form compared with the total number of workers.
* The total number of submissions for the day.
* The number of submissions pending review.
* A list of workers who have not submitted their daily form.
* A list of sites showing the number of submissions received for each site today.

Administrators can also view all submissions. The submission list displays up to 20 submissions per page and includes:

* Site
* Date and time
* Worker
* Note
* Number of photos
* Review status

Administrators can filter submissions by:

* Site
* Worker
* Date range

They can also sort submissions by:

* Date/time
* Review status

Selecting a submission opens its details, where an administrator can review the submitted information and mark the submission as Reviewed.

## Framer

Framer users can access their own submissions from their dashboard.

They can:

* View a list of their previous submissions.
* View the site, note, and number of photos for each submission.
* Select a submission to view its details.
* Complete and submit a daily safety form for a selected site.
* Report safety equipment and site conditions.
* Add notes to their submission.
* Upload photos as part of their submission.