import AuthForm from '../../components/auth-form';

const SignUp = () => {
  return (
    <AuthForm
      endpoint="/api/users/signup"
      title="Sign Up"
      buttonText="Sign Up"
    />
  );
};

export default SignUp;
