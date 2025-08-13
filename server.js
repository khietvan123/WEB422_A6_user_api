
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const userService = require('./user-service');

const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

userService.init(process.env.MONGO_URL)
  .then(()=>console.log('DB ready'))
  .catch(err=>{ console.error(err); process.exit(1); });

app.post('/api/user/register', async (req, res)=>{
  const { userName, password, password2 } = req.body;
  try{
    await userService.addUser(userName, password, password2);
    res.status(200).json({ message:'User registered' });
  }catch(err){
    res.status(400).json({ message: String(err) });
  }
});

app.post('/api/user/login', async (req, res)=>{
  const { userName, password } = req.body;
  try{
    const user = await userService.checkUser(userName, password);
    const payload = { _id: user._id, userName: user.userName };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'login successful', token });
  }catch(err){
    res.status(401).json({ message: String(err) });
  }
});

const auth = passport.authenticate('jwt', { session:false });

app.get('/api/user/favourites', auth, async (req, res)=>{
  try{ res.json(await userService.getFavourites(req.user._id)); }
  catch{ res.status(500).json([]); }
});
app.put('/api/user/favourites/:id', auth, async (req, res)=>{
  try{ res.json(await userService.addFavourite(req.user._id, Number(req.params.id))); }
  catch{ res.status(500).json([]); }
});
app.delete('/api/user/favourites/:id', auth, async (req, res)=>{
  try{ res.json(await userService.removeFavourite(req.user._id, Number(req.params.id))); }
  catch{ res.status(500).json([]); }
});

app.get('/api/user/history', auth, async (req, res)=>{
  try{ res.json(await userService.getHistory(req.user._id)); }
  catch{ res.status(500).json([]); }
});
app.put('/api/user/history/:q', auth, async (req, res)=>{
  try{ res.json(await userService.addHistory(req.user._id, req.params.q)); }
  catch{ res.status(500).json([]); }
});
app.delete('/api/user/history/:q', auth, async (req, res)=>{
  try{ res.json(await userService.removeHistory(req.user._id, req.params.q)); }
  catch{ res.status(500).json([]); }
});


const port = process.env.PORT || 8080;
app.listen(port, ()=> console.log('API listening on ' + port));