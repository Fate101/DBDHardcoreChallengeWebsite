# Dead by Daylight Challenge Board

A simple web-based challenge board for Dead by Daylight players to track their in-game challenges.

## Features

- Track multiple challenges
- Save challenge progress automatically
- Reset board functionality
- Simple and clean interface
- No database required

## Installation

1. Make sure you have PHP installed on your system (PHP 7.0 or higher recommended)
2. Download or clone this repository to your local machine
3. Place the files in your web server's directory (e.g., htdocs for XAMPP, www for WAMP)
4. Make sure the web server has write permissions for the directory (needed for saving challenge state)
5. Access the website through your web browser (e.g., http://localhost/challenge-board)

## Using XAMPP (Windows)

1. Download and install XAMPP from https://www.apachefriends.org/
2. Start Apache from the XAMPP Control Panel
3. Copy all files to the `htdocs` folder in your XAMPP installation directory
4. Access the website at http://localhost/challenge-board

## Using PHP's Built-in Server

If you don't want to install a full web server, you can use PHP's built-in server:

1. Open a terminal/command prompt
2. Navigate to the project directory
3. Run the command: `php -S localhost:8000`
4. Access the website at http://localhost:8000

## Customizing Challenges

To modify the default challenges, edit the `$challenges` array in `index.php`. Each challenge should have a 'name' and 'completed' property.

## File Structure

- `index.php` - Main interface and challenge display
- `save.php` - Handles saving challenge state
- `style.css` - Styling for the interface
- `challenge_state.json` - Automatically created to store challenge progress

## Security Note

This is a simple local application. If you plan to host it on a public server, consider adding additional security measures. 