import { Router } from 'express';

export const authRouter = Router();

interface SignInBody {
  email?: string;
  password?: string;
}

authRouter.post('/signin', (req, res) => {
  const { email, password } = req.body as SignInBody;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email and password are required.',
    });
  }

  return res.status(501).json({
    success: false,
    error: 'Sign-in flow is scaffolded. Implement credential validation and token exchange here.',
  });
});
