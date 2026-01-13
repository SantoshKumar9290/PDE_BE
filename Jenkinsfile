pipeline {
    agent any

    environment {
        GIT_URL = "https://github.com/SantoshKumar9290/PDE_BE.git"
        SONAR_HOST_URL = "http://10.10.120.20:9000"
        SONAR_TOKEN = "sqa_145323248fc75870b4e7e412ee4c5cc2c43c7ba8"
        APP_NAME = "pde_be"
        ENTRY_FILE = "index.js"
    }

    stages {

        stage('Checkout Code') {
            steps {
                git branch: 'main', url: "${GIT_URL}"
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    echo "Installing dependencies..."
                    npm install --legacy-peer-deps
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                sh '''
                    sonar-scanner \
                      -Dsonar.projectKey=pde_be \
                      -Dsonar.projectName=pde_be \
                      -Dsonar.sources=src \
                      -Dsonar.exclusions=node_modules/**,pdf/**,fonts/**,logos/** \
                      -Dsonar.host.url=${SONAR_HOST_URL} \
                      -Dsonar.login=${SONAR_TOKEN}
                '''
            }
        }

        stage('PM2 Deployment') {
            steps {
                sh '''
                    echo "Stopping old PM2 service..."
                    pm2 stop ${APP_NAME} || true
                    pm2 delete ${APP_NAME} || true

                    echo "Starting new PM2 cluster..."
                    pm2 start ${ENTRY_FILE} --name ${APP_NAME} -i max

                    pm2 save
                '''
            }
        }
    }

    post {
        success {
            echo "Backend PDE_BE Deployment Completed Successfully!"
        }
        failure {
            echo "Pipeline Failed. Check Jenkins logs."
        }
    }
}
