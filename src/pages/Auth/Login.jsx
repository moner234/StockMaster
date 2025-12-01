import React from 'react';
import AuthLayout from '../../components/Auth/AuthLayout';
import LoginForm from '../../components/Auth/LoginForm';

const Login = () => {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue managing your inventory"
    >
      <LoginForm />
    </AuthLayout>
  );
};

export default Login;
