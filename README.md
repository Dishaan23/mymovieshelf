# MyMovieShelf

## 📖 Overview
MyMovieShelf is a personal movie watchlist app that allows users to search for movies using the [OMDb API](http://www.omdbapi.com/) or [TMDb](https://www.themoviedb.org/), add them to a personal watchlist, mark them as watched, and leave short notes or ratings.

## ✨ Features
- 🔍 Search for movies by title using a public movie API
- ➕ Add movies to a personal watchlist
- ✅ Mark movies as watched
- 📝 Leave a short note or rating
- ❌ Remove movies from the list
- (Optional) 🔐 Auth system for personal watchlists

## 🛠 Tech Stack
- **Frontend:** ReactJS (Next.js if used)
- **Backend:** Django (or Flask if that’s what you used)
- **Database:** SQLite
- **API:** OMDb API (or TMDb)

## 🔑 How to Get API Key
1. Go to [OMDb](http://www.omdbapi.com/apikey.aspx) or [TMDb](https://www.themoviedb.org/settings/api).
2. Sign up and request an API key.
3. Add your API key to your `.env` file or config.

## 🚀 Local Setup Instructions

```bash
# Clone the repo
git clone https://github.com/Dishaan23/mymovieshelf.git
cd mymovieshelf

# Set up frontend
cd frontend
npm install
npm run dev

# Set up backend
cd ../movieshelfapp  # or your Django folder
pip install -r requirements.txt
python manage.py runserver
