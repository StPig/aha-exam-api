import Server from './server';
import config from './config';

const starter = new Server().start(config.PORT)
    .then((port) => console.log(`Running on port ${port}`))
    .catch((error) => {
      console.error(error);
    });

export default starter;
