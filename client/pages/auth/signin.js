import AuthForm from '../../components/auth-form';

const SignIn = () => {
  return (
    <AuthForm
      endpoint="/api/users/signin"
      title="Sign In"
      buttonText="Sign In"
    />
  );
};

export default SignIn;
