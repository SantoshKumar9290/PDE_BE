pipeline {
    agent any

    environment {
        GIT_URL = "https://github.com/SantoshKumar9290/PDE_BE.git"
        SONAR_HOST_URL = "http://10.10.120.20:9000"
        SONAR_TOKEN = "sqa_145323248fc75870b4e7e412ee4c5cc2c43c7ba8"
        BACKEND_DIR = "pde_be"
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
                    npm install
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
                      -Dsonar.exclusions=node_modules/**,dist/**,build/**,coverage/** \
                      -Dsonar.host.url=${SONAR_HOST_URL} \
                      -Dsonar.login=${SONAR_TOKEN}
                '''
            }
        }

        stage('Build Backend') {
            steps {
                sh '''
                    npm run build
                '''
            }
        }

        stage('PM2 Deployment') {
            steps {
                sh '''
                    pm2 stop pde_be || true
                    pm2 delete pde_be || true

                    pm2 start dist/app.js --name pde_be -i max

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
