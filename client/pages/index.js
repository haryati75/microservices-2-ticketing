import buildClient from '../api/build-client';

const LandingPage = ({ currentUser }) => {
  return currentUser ? (
    <h1>Welcome back, {currentUser.email}!</h1>
  ) : (
    <h1>Please sign up or sign in.</h1>
  );
};

LandingPage.getInitialProps = async (context) => {
  try {
    const client = buildClient(context);
    const { data } = await client.get('/api/users/currentuser');
    return data;
  } catch (error) {
    return {};
  }
};

export default LandingPage;
