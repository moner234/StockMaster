import React from 'react';
import AuthLayout from '../../components/Auth/AuthLayout';
import SignupForm from '../../components/Auth/SignupForm';

const Signup = () => {
  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start managing your inventory in minutes"
    >
      <SignupForm />
    </AuthLayout>
  );
};

export default Signup;
