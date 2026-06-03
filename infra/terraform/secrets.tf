resource "aws_secretsmanager_secret" "database_url" {
  name = "landshoppers/database_url"
}
resource "aws_secretsmanager_secret" "direct_url" {
  name = "landshoppers/direct_url"
}
resource "aws_secretsmanager_secret" "jwt_secret" {
  name = "landshoppers/jwt_secret"
}
resource "aws_secretsmanager_secret" "resend_api_key" {
  name = "landshoppers/resend_api_key"
}
resource "aws_secretsmanager_secret" "termii_api_key" {
  name = "landshoppers/termii_api_key"
}
resource "aws_secretsmanager_secret" "paystack_secret_key" {
  name = "landshoppers/paystack_secret_key"
}
resource "aws_secretsmanager_secret" "flutterwave_secret_key" {
  name = "landshoppers/flutterwave_secret_key"
}
resource "aws_secretsmanager_secret" "stripe_secret_key" {
  name = "landshoppers/stripe_secret_key"
}
resource "aws_secretsmanager_secret" "dojah_secret_key" {
  name = "landshoppers/dojah_secret_key"
}
resource "aws_secretsmanager_secret" "dojah_app_id" {
  name = "landshoppers/dojah_app_id"
}
resource "aws_secretsmanager_secret" "anthropic_api_key" {
  name = "landshoppers/anthropic_api_key"
}
resource "aws_secretsmanager_secret" "openai_api_key" {
  name = "landshoppers/openai_api_key"
}
resource "aws_secretsmanager_secret" "whatsapp_webhook_secret" {
  name = "landshoppers/whatsapp_webhook_secret"
}
resource "aws_secretsmanager_secret" "evolution_api_key" {
  name = "landshoppers/evolution_api_key"
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = var.database_url
}
resource "aws_secretsmanager_secret_version" "direct_url" {
  secret_id     = aws_secretsmanager_secret.direct_url.id
  secret_string = var.direct_url
}
resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}
resource "aws_secretsmanager_secret_version" "resend_api_key" {
  secret_id     = aws_secretsmanager_secret.resend_api_key.id
  secret_string = var.resend_api_key
}
resource "aws_secretsmanager_secret_version" "termii_api_key" {
  secret_id     = aws_secretsmanager_secret.termii_api_key.id
  secret_string = var.termii_api_key
}
resource "aws_secretsmanager_secret_version" "paystack_secret_key" {
  secret_id     = aws_secretsmanager_secret.paystack_secret_key.id
  secret_string = var.paystack_secret_key
}
resource "aws_secretsmanager_secret_version" "flutterwave_secret_key" {
  secret_id     = aws_secretsmanager_secret.flutterwave_secret_key.id
  secret_string = var.flutterwave_secret_key
}
resource "aws_secretsmanager_secret_version" "stripe_secret_key" {
  secret_id     = aws_secretsmanager_secret.stripe_secret_key.id
  secret_string = var.stripe_secret_key
}
resource "aws_secretsmanager_secret_version" "dojah_secret_key" {
  secret_id     = aws_secretsmanager_secret.dojah_secret_key.id
  secret_string = var.dojah_secret_key
}
resource "aws_secretsmanager_secret_version" "dojah_app_id" {
  secret_id     = aws_secretsmanager_secret.dojah_app_id.id
  secret_string = var.dojah_app_id
}
resource "aws_secretsmanager_secret_version" "anthropic_api_key" {
  secret_id     = aws_secretsmanager_secret.anthropic_api_key.id
  secret_string = var.anthropic_api_key
}
resource "aws_secretsmanager_secret_version" "openai_api_key" {
  secret_id     = aws_secretsmanager_secret.openai_api_key.id
  secret_string = var.openai_api_key
}
resource "aws_secretsmanager_secret_version" "whatsapp_webhook_secret" {
  secret_id     = aws_secretsmanager_secret.whatsapp_webhook_secret.id
  secret_string = var.whatsapp_webhook_secret
}
resource "aws_secretsmanager_secret_version" "evolution_api_key" {
  secret_id     = aws_secretsmanager_secret.evolution_api_key.id
  secret_string = var.evolution_api_key
}
