const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Use lean() for faster query execution
    const user = await User.findOne({ email })
      .select('+password')
      .lean()
      .exec();

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Cache successful login attempts
    const cacheKey = `login:${email}`;
    const cachedSession = await redisClient.get(cacheKey);

    if (cachedSession) {
      return res.json(JSON.parse(cachedSession));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const response = { user: sanitizeUser(user), token };

    // Cache the successful login for 5 minutes
    await redisClient.setex(cacheKey, 300, JSON.stringify(response));

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
