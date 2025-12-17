node {

    stage('Checkout') {
        checkout scm
    }

    stage('Install Dependencies') {
        sh '''
            echo "Node version:"
            node -v
            npm -v

            npm install --legacy-peer-deps
        '''
    }

    stage('SonarQube Analysis') {
        def scannerHome = tool 'SonarScanner'
        withSonarQubeEnv('pde_be') {
            sh "${scannerHome}/bin/sonar-scanner"
        }
    }

    stage('Start Backend (PM2)') {
        sh '''
            if ! command -v pm2 >/dev/null 2>&1; then
                npm install -g pm2
            fi

            pm2 delete pde_be || true
            pm2 start index.js --name pde_be
            pm2 save
            pm2 list
        '''
    }
}
