locals {
  ecr_base = "${var.aws_account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"

  # Secrets shared by all backend services
  common_secrets = [
    { name = "DATABASE_URL",  valueFrom = aws_secretsmanager_secret.database_url.arn },
    { name = "DIRECT_URL",    valueFrom = aws_secretsmanager_secret.direct_url.arn },
    { name = "JWT_SECRET",    valueFrom = aws_secretsmanager_secret.jwt_secret.arn },
    { name = "RESEND_API_KEY", valueFrom = aws_secretsmanager_secret.resend_api_key.arn },
    { name = "TERMII_API_KEY", valueFrom = aws_secretsmanager_secret.termii_api_key.arn },
    { name = "PAYSTACK_SECRET_KEY",    valueFrom = aws_secretsmanager_secret.paystack_secret_key.arn },
    { name = "FLUTTERWAVE_SECRET_KEY", valueFrom = aws_secretsmanager_secret.flutterwave_secret_key.arn },
    { name = "STRIPE_SECRET_KEY",      valueFrom = aws_secretsmanager_secret.stripe_secret_key.arn },
    { name = "DOJAH_SECRET_KEY",       valueFrom = aws_secretsmanager_secret.dojah_secret_key.arn },
    { name = "DOJAH_APP_ID",           valueFrom = aws_secretsmanager_secret.dojah_app_id.arn },
    { name = "WHATSAPP_WEBHOOK_SECRET", valueFrom = aws_secretsmanager_secret.whatsapp_webhook_secret.arn },
    { name = "EVOLUTION_API_KEY",       valueFrom = aws_secretsmanager_secret.evolution_api_key.arn },
    { name = "ANTHROPIC_API_KEY",       valueFrom = aws_secretsmanager_secret.anthropic_api_key.arn },
    { name = "OPENAI_API_KEY",          valueFrom = aws_secretsmanager_secret.openai_api_key.arn },
  ]
}

resource "aws_ecs_cluster" "main" {
  name = "landshoppers"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

# ── CloudWatch log groups ─────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "ecs" {
  for_each          = toset(["web", "api", "ai", "workers", "migrate"])
  name              = "/ecs/landshoppers/${each.key}"
  retention_in_days = 30
}

# ── API ───────────────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "api" {
  family                   = "landshoppers-api"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_exec.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = "${local.ecr_base}/landshoppers-api:latest"
    essential = true
    portMappings = [{ containerPort = 4001, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV",            value = "production" },
      { name = "PORT",                value = "4001" },
      { name = "REDIS_URL",           value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379" },
      { name = "OPENSEARCH_URL",      value = var.enable_opensearch ? "https://${aws_opensearch_domain.main[0].endpoint}" : "" },
      { name = "OPENSEARCH_LISTINGS_INDEX", value = "landshoppers-listings-v1" },
      { name = "SEARCH_BACKEND",      value = var.enable_opensearch ? "opensearch" : "auto" },
      { name = "CORS_ORIGINS",        value = "https://${var.app_domain},https://www.${var.app_domain}" },
      { name = "AI_SERVICE_URL",      value = "http://ai.landshoppers.internal:8000" },
      { name = "JWT_ACCESS_EXPIRES",  value = "15m" },
      { name = "AWS_REGION",          value = var.aws_region },
      { name = "AWS_S3_BUCKET",       value = "${var.aws_account_id}-landshoppers-media" },
      { name = "TERMII_SENDER_ID",    value = "LandShoppers" },
      { name = "EVOLUTION_API_URL",   value = var.evolution_api_url },
    ]
    secrets = local.common_secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/landshoppers/api"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "api"
      }
    }
  }])
}

resource "aws_ecs_service" "api" {
  name            = "landshoppers-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 4001
  }

  depends_on = [aws_lb_listener.https]
}

# ── Workers ───────────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "workers" {
  family                   = "landshoppers-workers"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.workers_cpu
  memory                   = var.workers_memory
  execution_role_arn       = aws_iam_role.ecs_exec.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "workers"
    image     = "${local.ecr_base}/landshoppers-workers:latest"
    essential = true
    environment = [
      { name = "NODE_ENV",        value = "production" },
      { name = "REDIS_URL",       value = "redis://${aws_elasticache_cluster.redis.cache_nodes[0].address}:6379" },
      { name = "OPENSEARCH_URL",  value = var.enable_opensearch ? "https://${aws_opensearch_domain.main[0].endpoint}" : "" },
      { name = "SEARCH_BACKEND",  value = var.enable_opensearch ? "opensearch" : "auto" },
      { name = "AWS_REGION",      value = var.aws_region },
    ]
    secrets = local.common_secrets
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/landshoppers/workers"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "workers"
      }
    }
  }])
}

resource "aws_ecs_service" "workers" {
  name            = "landshoppers-workers"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.workers.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }
}

# ── AI Service ────────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "ai" {
  family                   = "landshoppers-ai"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ai_cpu
  memory                   = var.ai_memory
  execution_role_arn       = aws_iam_role.ecs_exec.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "ai"
    image     = "${local.ecr_base}/landshoppers-ai:latest"
    essential = true
    portMappings = [{ containerPort = 8000, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV",              value = "production" },
      { name = "AI_SERVICE_PORT",       value = "8000" },
      { name = "AI_SERVICE_HOST",       value = "0.0.0.0" },
      { name = "AI_FIXTURE_MODE",       value = "false" },
      { name = "AI_AUDIT_TO_DB",        value = "true" },
      { name = "AI_RATE_LIMIT_PER_MINUTE", value = "120" },
      { name = "AI_CORS_ORIGINS",       value = "https://${var.app_domain}" },
      { name = "PYTHONUNBUFFERED",      value = "1" },
    ]
    secrets = [
      { name = "DATABASE_URL",      valueFrom = aws_secretsmanager_secret.database_url.arn },
      { name = "ANTHROPIC_API_KEY", valueFrom = aws_secretsmanager_secret.anthropic_api_key.arn },
      { name = "OPENAI_API_KEY",    valueFrom = aws_secretsmanager_secret.openai_api_key.arn },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/landshoppers/ai"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ai"
      }
    }
  }])
}

resource "aws_ecs_service" "ai" {
  name            = "landshoppers-ai"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.ai.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  # Register with Cloud Map so API can reach it as ai.landshoppers.internal:8000
  service_registries {
    registry_arn = aws_service_discovery_service.ai.arn
  }
}

# ── Web ───────────────────────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "web" {
  family                   = "landshoppers-web"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.web_cpu
  memory                   = var.web_memory
  execution_role_arn       = aws_iam_role.ecs_exec.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "web"
    image     = "${local.ecr_base}/landshoppers-web:latest"
    essential = true
    portMappings = [{ containerPort = 3000, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT",     value = "3000" },
      { name = "HOSTNAME", value = "0.0.0.0" },
      # NEXT_PUBLIC_* vars are baked into the image at build time — no need here
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/landshoppers/web"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "web"
      }
    }
  }])
}

resource "aws_ecs_service" "web" {
  name            = "landshoppers-web"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.https]
}

# ── One-off migration task definition ─────────────────────────────────────────
resource "aws_ecs_task_definition" "migrate" {
  family                   = "landshoppers-migrate"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_exec.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "migrate"
    image     = "${local.ecr_base}/landshoppers-api:latest"
    essential = true
    command   = ["pnpm", "db:migrate"]
    environment = [
      { name = "NODE_ENV", value = "production" },
    ]
    secrets = [
      { name = "DATABASE_URL", valueFrom = aws_secretsmanager_secret.database_url.arn },
      { name = "DIRECT_URL",   valueFrom = aws_secretsmanager_secret.direct_url.arn },
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/landshoppers/migrate"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "migrate"
      }
    }
  }])
}
