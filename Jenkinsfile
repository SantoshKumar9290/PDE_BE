pipeline {
    agent any

    tools {
        nodejs 'Node16'
    }

    environment {
        APP_NAME = 'pde_be'
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "Node Version:"
                    node -v
                    npm -v

                    npm install --legacy-peer-deps
                '''
            }
        }

        stage('SonarQube Scan') {
            steps {
                withSonarQubeEnv('pde_be') {
                    sh '''
                        sonar-scanner
                    '''
                }
            }
        }

        stage('Start / Restart App (PM2)') {
            steps {
                sh '''
                    if ! command -v pm2 >/dev/null 2>&1; then
                        npm install -g pm2
                    fi

                    pm2 delete ${APP_NAME} || true
                    pm2 start index.js --name ${APP_NAME}
                    pm2 save
                    pm2 list
                '''
            }
        }
    }

    post {
        success {
            echo "PDE Backend pipeline completed successfully"
        }
        failure {
            echo "Pipeline failed. Check logs."
        }
    }
}
