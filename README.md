# Hardcore Survivor - Dead by Daylight Challenge Mode

A web-based challenge mode for Dead by Daylight that adds a hardcore survival experience with economy, progression, and risk management systems.

## Game Overview

Hardcore Survivor transforms Dead by Daylight into a challenging survival experience where you must manage resources, unlock perks, and progress through ranks while trying to survive against the killer.

## Core Features

### Economy System
- Starting balance: $250
- Earn money through:
  - Generator completion ($8 base + $2 per additional, max +$8)
  - Safe unhooks ($10 each, unlimited)
  - Stuns ($12 base + $4 per additional, max +$8)
  - Escapes ($15 base, +$10 if after hatch closed)

### Rank & Progression
- Rank tiers: Ash → Silver → Gold → Iridescent
- Pip requirements:
  - Ash IV-III: 3 pips
  - Ash II: 3 pips
  - Ash I: 4 pips
  - Silver-Gold: 5 pips each
  - Iridescent IV-III: 5 pips
  - Iridescent II: 5 pips
  - Iridescent I: 1 pip

### Perk System
- Perk ratings (1-5 stars) affect cost
- Perk unlocking:
  - General perks always available
  - Survivor's unique perks always available
  - Other survivors' perks require 6 uses to unlock
- Perk cooldown:
  - 3 consecutive uses triggers 2-match cooldown
  - Cooldown only applies to unlocked perks

### Survivor Management
- Survivor elimination system
- Revival system (50% of rental price)
- One-time revival per survivor
- Survivor selling (50% of rental price)

### Loadout Costs
- Survivor rental costs based on:
  - Survivor rating (1-3 stars)
  - Current rank
- Perk costs based on:
  - Perk rating (1-5 stars)
  - Current rank
- Item/Add-on costs based on:
  - Rarity (Brown to Red)
  - Current rank
- Additional services:
  - Tunnel Insurance: $20
  - Revival: 50% of rental price
  - Perk Recharge: $5 each

### Match Tracking
- Comprehensive match history
- Performance tracking:
  - Generators completed (0-5)
  - Safe unhooks (0-8)
  - Stuns (0-3)
  - Pips earned (0-2)
  - Escape status
  - Hatch closure
- Filtering options:
  - All matches
  - Escaped only
  - Died only
- Sorting options:
  - Newest first
  - Oldest first
  - Highest earnings
  - Lowest earnings

## Installation

1. Make sure you have PHP installed on your system (PHP 7.0 or higher recommended)
2. Download or clone this repository to your local machine
3. Place the files in your web server's directory (e.g., htdocs for XAMPP, www for WAMP)
4. Make sure the web server has write permissions for the directory
5. Access the website through your web browser (e.g., http://localhost/hardcore-survivor)

## Using XAMPP (Windows)

1. Download and install XAMPP from https://www.apachefriends.org/
2. Start Apache from the XAMPP Control Panel
3. Copy all files to the `htdocs` folder in your XAMPP installation directory
4. Access the website at http://localhost/hardcore-survivor

## Using PHP's Built-in Server

If you don't want to install a full web server, you can use PHP's built-in server:

1. Open a terminal/command prompt
2. Navigate to the project directory
3. Run the command: `php -S localhost:8000`
4. Access the website at http://localhost:8000

## File Structure

- `index.php` - Main interface and game display
- `js/match-tracker.js` - Core game logic and mechanics
- `style.css` - Styling for the interface
- `challenge_state.json` - Automatically created to store game state

## Data Storage

The game uses localStorage to save:
- Match history
- Bank balance
- Current rank and pips
- Perk usage tracking
- Perk history for cooldowns

## Security Note

This is a local application. If you plan to host it on a public server, consider adding additional security measures.

## Contributing

Feel free to submit issues and enhancement requests! 