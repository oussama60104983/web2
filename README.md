NOTE: Please run the presentation.js file to run the application


Database Creation:
   -Set up MongoDB with collections for storing user data, session data, and feeding station locations.

Persistence Layer:
Establish a connection to the MongoDB database.
  Implement functions to:
    Retrieve user details.
    Hash passwords for secure storage.
    Manage sessions (start, update, terminate).
    Access information about feeding station locations.

Business Logic Layer:
   Develop functions that directly interface with the persistence layer, passing data back and forth.
   Add business logic for:
     Session management.
     User login processes.

Presentation Layer:
   Write functions to:
    Redirect users to the appropriate page (admin or member) based on their user type.
    Display an error message for invalid login credentials.
    Ensure users can only sign up with a unique email and username; display an error for duplicates.
    Show a home page listing feeding station locations to all visitors.
    Enable users to log out, redirecting them to a public page upon session termination.