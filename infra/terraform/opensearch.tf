# Amazon OpenSearch Service — only created when var.enable_opensearch = true
# Cost: ~$25/mo minimum for t3.small. If you leave this false, the API
# falls back to Postgres full-text search (SEARCH_BACKEND=auto).

resource "aws_opensearch_domain" "main" {
  count       = var.enable_opensearch ? 1 : 0
  domain_name = "landshoppers"

  engine_version = "OpenSearch_2.11"

  cluster_config {
    instance_type  = var.opensearch_instance_type
    instance_count = 1
  }

  ebs_options {
    ebs_enabled = true
    volume_size = 20
  }

  vpc_options {
    subnet_ids         = [aws_subnet.private[0].id]
    security_group_ids = [aws_security_group.opensearch[0].id]
  }

  encrypt_at_rest { enabled = true }
  node_to_node_encryption { enabled = true }
  domain_endpoint_options { enforce_https = true }

  advanced_security_options {
    enabled                        = false
    anonymous_auth_enabled         = true
    internal_user_database_enabled = false
  }
}
