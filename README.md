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
- 
![Screenshot 2025-06-09 203509](https://github.com/user-attachments/assets/bc0f36ff-9f9b-4900-82b7-d38561649595)



![Screenshot 2025-06-09 203648](https://github.com/user-attachments/assets/d17baa8c-89f5-4f65-b056-81f9642c3b51)



## 🛠 Tech Stack
- **Frontend:** ReactJS (Next.js if used)
- **Backend:** Django (or Flask if that’s what you used)
- **Database:** SQLite
- **API:** OMDb API (or TMDb)





![Screenshot 2025-06-09 203623](https://github.com/user-attachments/assets/3b32eada-68d9-4d4c-9f8c-0f6bad98ea4d)






## 🔑 How to Get API Key
1. Go to [OMDb](http://www.omdbapi.com/apikey.aspx) or [TMDb](https://www.themoviedb.org/settings/api).
2. Sign up and request an API key.
3. Add your API key to your `.env` file or config.


![Screenshot 2025-06-09 203728](https://github.com/user-attachments/assets/44ebb4d1-adc6-4f2a-bfb9-a6755783a2e0)




![Screenshot 2025-06-09 203826](https://github.com/user-attachments/assets/21d4f676-6c43-467c-8b00-62a5c08f4e54)



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



![Screenshot 2025-06-09 203545](https://github.com/user-attachments/assets/5360c883-230a-4f25-8288-b77ae663b1e6)




![Screenshot 2025-06-09 203602](https://github.com/user-attachments/assets/63fd6215-077a-4dd6-a59a-5793647b80c0)
