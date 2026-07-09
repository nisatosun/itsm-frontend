import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: 'http://localhost:8082',
  realm: 'itsm-realm',
  clientId: 'itsm-frontend',
});

export default keycloak;
