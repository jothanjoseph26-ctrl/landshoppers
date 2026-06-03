resource "aws_lb" "main" {
  name               = "landshoppers"
  load_balancer_type = "application"
  subnets            = aws_subnet.public[*].id
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "web" {
  name        = "landshoppers-web"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

resource "aws_lb_target_group" "api" {
  name        = "landshoppers-api"
  port        = 4001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    interval            = 30
  }
}

# HTTP → HTTPS redirect
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
  condition {
    host_header { values = ["api.${var.app_domain}"] }
  }
}

# ── TLS Certificate (ACM) ─────────────────────────────────────────────────────
# Covers landshoppersrealty.com.ng and *.landshoppersrealty.com.ng
#
# DEPLOY IN TWO PHASES:
#   Phase 1 — create only the cert to get the DNS validation records:
#     terraform apply -target=aws_acm_certificate.main
#   Then check outputs for the CNAME records to add at your registrar:
#     terraform output acm_certificate_validation_options
#   Phase 2 — after DNS has propagated (~5-30 min), apply everything:
#     terraform apply

resource "aws_acm_certificate" "main" {
  domain_name               = var.app_domain
  subject_alternative_names = ["*.${var.app_domain}"]
  validation_method         = "DNS"
  lifecycle { create_before_destroy = true }
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn = aws_acm_certificate.main.arn
  # Terraform waits here until AWS confirms DNS validation has passed.
  # Make sure you've added the CNAME records before running Phase 2.
}
