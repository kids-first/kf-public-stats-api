@Library(value='kids-first/aws-infra-jenkins-shared-libraries', changelog=false) _
ecs_service_type_1_standard {
    projectName             = "kf-public-stats-api"
    create_default_iam_role = "1"
    environments            = "qa,prd"
    docker_image_type       = "alpine"
    entrypoint_command      = "yarn start"
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
    dependencies            = "ecr"
    additional_ssl_cert_domain_name = "*.kidsfirstdrc.org"
    publish_to_public_repo = "true"
    create_additional_internal_alb = "1"
}


