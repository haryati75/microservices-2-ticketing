import buildClient from '../api/build-client';

const LandingPage = ({ currentUser }) => {
  console.log('currentUser', currentUser);
  return <h1>Welcome to the Ticketing App</h1>;
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
