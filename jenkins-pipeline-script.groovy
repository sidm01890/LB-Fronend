pipeline {
    agent any
    
    options {
        skipDefaultCheckout(true)
    }
    
    parameters {
        choice(
            name: 'REPOSITORY',
            choices: [
                'LB-Uploader',
                'LB-Backend',
                'LB-Fronend',
                'reconcii',
                'python-code',
                'Uploader-New'
            ],
            description: 'Select repository to deploy'
        )
        string(
            name: 'BRANCH',
            defaultValue: 'main',
            description: 'Enter branch name manually'
        )
    }
    
    environment {
        REPO_URL = "https://github.com/sidm01890/${params.REPOSITORY}.git"
        SERVER_HOST = '65.0.236.144'
        SERVER_USER = 'ubuntu'
        PROJECT_DIR = '/home/ubuntu/LaughingBuddha'
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "📦 Checking out ${params.REPOSITORY} from branch: ${params.BRANCH}"
                    
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: "*/${params.BRANCH}"]],
                        userRemoteConfigs: [[
                            url: "${REPO_URL}"
                        ]],
                        extensions: [[$class: 'CleanCheckout']]
                    ])
                }
            }
        }
        
        stage('Verify Changes') {
            steps {
                script {
                    echo "🔍 Verifying changes from ${params.REPOSITORY}:${params.BRANCH}"
                    sh '''
                        git log --oneline -5
                        git status
                    '''
                }
            }
        }
        
        stage('Deploy to Server') {
            steps {
                script {
                    // Determine service name and docker-compose file based on repository
                    def serviceMap = [
                        'LB-Uploader': 'uploader',
                        'LB-Backend': 'backend',
                        'LB-Fronend': 'frontend'
                    ]
                    
                    def serviceName = serviceMap.get(params.REPOSITORY, params.REPOSITORY.toLowerCase())
                    def projectSubDir = serviceMap.containsKey(params.REPOSITORY) ? 
                        serviceMap.get(params.REPOSITORY).capitalize() : 
                        params.REPOSITORY
                    
                    echo "🚀 Deploying ${serviceName} to server..."
                    
                    try {
                        withCredentials([sshUserPrivateKey(credentialsId: 'ssh-key', keyFileVariable: 'SSH_KEY_FILE', usernameVariable: 'SSH_USER')]) {
                            // Copy files to server
                            sh """
                                echo "📤 Copying files to server..."
                                tar --exclude='.git' \
                                    --exclude='__pycache__' \
                                    --exclude='*.pyc' \
                                    --exclude='.pytest_cache' \
                                    --exclude='node_modules' \
                                    --exclude='dist' \
                                    --exclude='build' \
                                    --exclude='data' \
                                    --exclude='logs' \
                                    --exclude='reports' \
                                    -czf - . | ssh -i ${SSH_KEY_FILE} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SSH_USER}@${SERVER_HOST} "
                                    mkdir -p ${PROJECT_DIR}/${projectSubDir} &&
                                    cd ${PROJECT_DIR}/${projectSubDir} &&
                                    tar -xzf -
                                "
                            """
                            
                            // Deploy on server
                            sh """
                                ssh -i ${SSH_KEY_FILE} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 ${SSH_USER}@${SERVER_HOST} bash -s <<DEPLOY_EOF
set -e
cd ${PROJECT_DIR}

echo "🛑 Stopping and removing container..."
docker compose -f docker-compose.staging.yml stop ${serviceName} || echo "Container not running"
docker compose -f docker-compose.staging.yml rm -f ${serviceName} || echo "Container not found"

echo "🔨 Rebuilding image (no cache)..."
docker compose -f docker-compose.staging.yml build --no-cache ${serviceName} || { echo "❌ Build failed"; exit 1; }

echo "🚀 Starting container..."
docker compose -f docker-compose.staging.yml up -d ${serviceName} || { echo "❌ Start failed"; exit 1; }

echo "⏳ Waiting for startup (25 seconds)..."
sleep 25

echo "✅ Verifying deployment..."
docker compose -f docker-compose.staging.yml ps ${serviceName} || { echo "❌ Container not running"; exit 1; }
docker compose -f docker-compose.staging.yml logs --tail=10 ${serviceName}
DEPLOY_EOF
                            """
                        }
                    } catch (Exception e) {
                        echo "❌ Deployment failed: ${e.getMessage()}"
                        currentBuild.result = 'FAILURE'
                        throw e
                    }
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    def serviceMap = [
                        'LB-Uploader': 'uploader',
                        'LB-Backend': 'backend',
                        'LB-Fronend': 'frontend'
                    ]
                    def serviceName = serviceMap.get(params.REPOSITORY, params.REPOSITORY.toLowerCase())
                    
                    echo "✅ Verifying deployment..."
                    withCredentials([sshUserPrivateKey(credentialsId: 'ssh-key', keyFileVariable: 'SSH_KEY_FILE', usernameVariable: 'SSH_USER')]) {
                        sh """
                            ssh -i ${SSH_KEY_FILE} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${SSH_USER}@${SERVER_HOST} bash -s <<VERIFY_EOF
set -e
cd ${PROJECT_DIR}

echo "📊 Checking container status..."
docker compose -f docker-compose.staging.yml ps ${serviceName} || { echo "❌ Container not running"; exit 1; }

echo "✅ Container is running!"
VERIFY_EOF
                        """
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "✅ Deployment successful for ${params.REPOSITORY}:${params.BRANCH}!"
        }
        failure {
            echo "❌ Deployment failed for ${params.REPOSITORY}:${params.BRANCH}!"
        }
    }
}

