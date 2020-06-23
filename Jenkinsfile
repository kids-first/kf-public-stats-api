@Library(value='kids-first/aws-infra-jenkins-shared-libraries', changelog=false) _
ecs_service_type_1_standard {
    projectName             = "kf-public-stats-api"
    create_default_iam_role = "0"
    environments            = "dev,qa,prd"
    destroy_dev             = "true"
    docker_image_type       = "debian"
    entrypoint_command      = "/srv/ego/exec/run.sh"
    deploy_scripts_version  = "master"
    quick_deploy            = "true"
    external_config_repo    = "false"
    container_port          = "2001"
    vcpu_container          = "2048"
    memory_container        = "4096"
    vcpu_task               = "2048"
    memory_task             = "4096"
    health_check_path       = "/v1/status"
    internal_app            = "false"
}


