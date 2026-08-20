# Spending Track

A small personal spending tracker that runs entirely in the browser.

## Features

- Monthly calendar homepage
- Click any date to view/edit that day's spending
- Daily categories:
  - Lunch
  - Dinner
  - Coffee / milk tea / supermarket
- Daily target: ¥70
- Green circle = at or under ¥70
- Red circle = over ¥70
- Monthly total shows money saved or overspent compared with the ¥70 target
- Optional pocket-money tracker
- Set a different allowance amount for each 15-day period
- Add pocket-money expenses with date, description, and amount
- Warning when less than half of the allowance remains while the 15-day period is not yet halfway through
- Data is saved locally in the browser with localStorage; nothing is uploaded to a server

## GitHub Pages

1. Upload `index.html` to a GitHub repository.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch**.
4. Select the branch containing `index.html` and `/ (root)`.
5. Save.

## Vercel

Import the GitHub repository into Vercel. No build command is required for this single-page version.
