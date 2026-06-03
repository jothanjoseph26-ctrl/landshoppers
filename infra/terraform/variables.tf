variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-west-1"
}

variable "aws_account_id" {
  description = "12-digit AWS account ID"
  type        = string
}

variable "environment" {
  description = "Deployment environment label"
  type        = string
  default     = "production"
}

variable "app_domain" {
  description = "Primary domain"
  type        = string
  default     = "landshoppersrealty.com.ng"
}

variable "github_org" {
  description = "GitHub organisation or username that owns the repo"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository name (without org prefix)"
  type        = string
  default     = "landshoppers"
}

# ── Database ─────────────────────────────────────────────────────────────────
variable "database_url" {
  description = "Neon pooled PostgreSQL connection string"
  type        = string
  sensitive   = true
}

variable "direct_url" {
  description = "Neon direct PostgreSQL connection string for migrations"
  type        = string
  sensitive   = true
}

# ── Auth ──────────────────────────────────────────────────────────────────────
variable "jwt_secret" {
  description = "JWT signing secret (min 32 chars)"
  type        = string
  sensitive   = true
}

# ── External APIs ─────────────────────────────────────────────────────────────
variable "anthropic_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "openai_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "resend_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "termii_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "paystack_secret_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "flutterwave_secret_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "stripe_secret_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "dojah_secret_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "dojah_app_id" {
  type      = string
  sensitive = true
  default   = ""
}

variable "mapbox_token" {
  type      = string
  sensitive = true
  default   = ""
}

variable "evolution_api_key" {
  type      = string
  sensitive = true
  default   = ""
}

variable "evolution_api_url" {
  type    = string
  default = ""
}

variable "whatsapp_webhook_secret" {
  type      = string
  sensitive = true
  default   = ""
}

# ── Compute sizing ────────────────────────────────────────────────────────────
variable "web_cpu" {
  type    = number
  default = 256
}

variable "web_memory" {
  type    = number
  default = 512
}

variable "api_cpu" {
  type    = number
  default = 512
}

variable "api_memory" {
  type    = number
  default = 1024
}

variable "ai_cpu" {
  type    = number
  default = 1024
}

variable "ai_memory" {
  type    = number
  default = 2048
}

variable "workers_cpu" {
  type    = number
  default = 256
}

variable "workers_memory" {
  type    = number
  default = 512
}

# ── ElastiCache ───────────────────────────────────────────────────────────────
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.micro"
}

# ── OpenSearch (optional) ─────────────────────────────────────────────────────
variable "enable_opensearch" {
  description = "Deploy Amazon OpenSearch Service (~$25/mo minimum)"
  type        = bool
  default     = false
}

variable "opensearch_instance_type" {
  type    = string
  default = "t3.small.search"
}
