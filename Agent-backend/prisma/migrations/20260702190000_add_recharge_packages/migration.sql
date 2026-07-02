-- Adds real database storage for Studio Pricing > Recharge Package CRUD.
-- Recharge packages intentionally store base_tokens/bonus_tokens snapshots so historical packages
-- remain auditable even if pricing_rules.agentTokensPerRmb changes later.
CREATE TABLE IF NOT EXISTS `recharge_packages` (
  `id` CHAR(36) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `amount_rmb` DECIMAL(12, 2) NOT NULL,
  `base_tokens` BIGINT NOT NULL,
  `agent_tokens` BIGINT NOT NULL,
  `bonus_tokens` BIGINT NOT NULL DEFAULT 0,
  `discount_percent` DECIMAL(8, 2) NOT NULL DEFAULT 0,
  `status` ENUM('ACTIVE','PUBLISHED','DISABLED','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  `sort_order` INT NOT NULL DEFAULT 100,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `recharge_packages_status_sort_order_idx` (`status`, `sort_order`),
  INDEX `recharge_packages_amount_rmb_idx` (`amount_rmb`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
