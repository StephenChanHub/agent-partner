-- CreateTable
CREATE TABLE `users` (
`id` CHAR(36) NOT NULL,
`email` VARCHAR(255) NOT NULL,
`password_hash` VARCHAR(255) NOT NULL,
`nickname` VARCHAR(64) NOT NULL,
`avatar_url` VARCHAR(512) NULL,
`email_verified_at` DATETIME(3) NULL,
`role` ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
`balance_tokens` BIGINT NOT NULL DEFAULT 0,
`used_tokens` BIGINT NOT NULL DEFAULT 0,
`current_session_id` CHAR(36) NULL,
`last_seen_at` DATETIME(3) NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_current_session_id_idx`(`current_session_id`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `devices` (
`id` CHAR(36) NOT NULL,
`user_id` CHAR(36) NOT NULL,
`device_sn` VARCHAR(128) NOT NULL,
`name` VARCHAR(128) NOT NULL,
`device_type` ENUM('VOICE_TERMINAL', 'MOBILE_ROBOT', 'DESKTOP_CLIENT') NOT NULL,
`token_hash` VARCHAR(255) NOT NULL,
`capabilities` JSON NULL,
`status` ENUM('BOUND', 'REVOKED', 'DISABLED') NOT NULL DEFAULT 'BOUND',
`last_seen_at` DATETIME(3) NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `devices_device_sn_key`(`device_sn`),
    INDEX `devices_user_id_idx`(`user_id`),
    INDEX `devices_status_idx`(`status`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_profiles` (
`id` CHAR(36) NOT NULL,
`provider` ENUM('MOCK', 'GEMINI', 'DEEPSEEK', 'OPENAI', 'CLAUDE', 'CUSTOM') NOT NULL,
`display_name` VARCHAR(128) NOT NULL,
`model_name` VARCHAR(128) NOT NULL,
`base_url` VARCHAR(512) NULL,
`api_key_encrypted` TEXT NULL,
`api_key_last_four` VARCHAR(16) NULL,
`default_temperature` DECIMAL(4, 2) NULL,
`default_max_tokens` INTEGER NULL,
`default_timeout_ms` INTEGER NULL,
`extra_config` JSON NULL,
`status` ENUM('ACTIVE', 'PUBLISHED', 'DISABLED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
`is_default` BOOLEAN NOT NULL DEFAULT false,
`created_by_id` CHAR(36) NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updated_at` DATETIME(3) NOT NULL,

    INDEX `model_profiles_provider_status_idx`(`provider`, `status`),
    INDEX `model_profiles_is_default_idx`(`is_default`),
    INDEX `model_profiles_created_by_id_idx`(`created_by_id`),
    UNIQUE INDEX `model_profiles_provider_display_name_key`(`provider`, `display_name`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `voice_profiles` (
`id` CHAR(36) NOT NULL,
`provider` ENUM('MOCK', 'ELEVENLABS', 'OPENAI', 'AZURE', 'LOCAL', 'CUSTOM') NOT NULL,
`display_name` VARCHAR(128) NOT NULL,
`voice_id` VARCHAR(255) NOT NULL,
`model_id` VARCHAR(128) NULL,
`output_format` VARCHAR(64) NULL,
`language` VARCHAR(32) NULL,
`description` TEXT NULL,
`preview_audio_url` VARCHAR(512) NULL,
`default_speed` DECIMAL(4, 2) NULL,
`default_stability` DECIMAL(4, 2) NULL,
`default_similarity_boost` DECIMAL(4, 2) NULL,
`extra_config` JSON NULL,
`status` ENUM('ACTIVE', 'PUBLISHED', 'DISABLED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
`is_default` BOOLEAN NOT NULL DEFAULT false,
`created_by_id` CHAR(36) NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updated_at` DATETIME(3) NOT NULL,

    INDEX `voice_profiles_provider_status_idx`(`provider`, `status`),
    INDEX `voice_profiles_language_idx`(`language`),
    INDEX `voice_profiles_is_default_idx`(`is_default`),
    INDEX `voice_profiles_created_by_id_idx`(`created_by_id`),
    UNIQUE INDEX `voice_profiles_provider_voice_id_key`(`provider`, `voice_id`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agents` (
`id` CHAR(36) NOT NULL,
`slug` VARCHAR(128) NOT NULL,
`status` ENUM('DRAFT', 'PUBLISHED', 'DISABLED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
`published_version_id` CHAR(36) NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agents_slug_key`(`slug`),
    INDEX `agents_status_idx`(`status`),
    INDEX `agents_published_version_id_idx`(`published_version_id`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_versions` (
`id` CHAR(36) NOT NULL,
`agent_id` CHAR(36) NOT NULL,
`version` VARCHAR(32) NOT NULL,
`status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
`manifest` JSON NOT NULL,
`manifest_hash` VARCHAR(128) NOT NULL,
`changelog` TEXT NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updated_at` DATETIME(3) NOT NULL,

    INDEX `agent_versions_agent_id_idx`(`agent_id`),
    INDEX `agent_versions_status_idx`(`status`),
    UNIQUE INDEX `agent_versions_agent_id_version_key`(`agent_id`, `version`),
    UNIQUE INDEX `agent_versions_agent_id_manifest_hash_key`(`agent_id`, `manifest_hash`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_sessions` (
`id` CHAR(36) NOT NULL,
`user_id` CHAR(36) NOT NULL,
`agent_id` CHAR(36) NOT NULL,
`title` VARCHAR(128) NULL,
`status` ENUM('ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
`summary` LONGTEXT NULL,
`summary_updated_at` DATETIME(3) NULL,
`message_count` INTEGER NOT NULL DEFAULT 0,
`last_message_at` DATETIME(3) NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updated_at` DATETIME(3) NOT NULL,
`archived_at` DATETIME(3) NULL,

    INDEX `agent_sessions_user_id_updated_at_idx`(`user_id`, `updated_at`),
    INDEX `agent_sessions_agent_id_idx`(`agent_id`),
    INDEX `agent_sessions_status_idx`(`status`),
    UNIQUE INDEX `agent_sessions_user_id_agent_id_key`(`user_id`, `agent_id`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
`id` CHAR(36) NOT NULL,
`agent_session_id` CHAR(36) NOT NULL,
`role` ENUM('USER', 'ASSISTANT', 'SYSTEM', 'TOOL') NOT NULL,
`content` LONGTEXT NOT NULL,
`metadata` JSON NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `messages_agent_session_id_created_at_idx`(`agent_session_id`, `created_at`),
    INDEX `messages_role_idx`(`role`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `runtime_events` (
`id` CHAR(36) NOT NULL,
`source` ENUM('DASHBOARD', 'DEVICE', 'STUDIO', 'SYSTEM', 'SCHEDULER', 'WEBHOOK') NOT NULL,
`type` ENUM('USER_TEXT', 'USER_VOICE', 'DEVICE_CONNECTED', 'DEVICE_HEARTBEAT', 'DEVICE_TELEMETRY', 'ROBOT_ACTION_RESULT', 'STUDIO_AGENT_PUBLISHED', 'SYSTEM_TASK') NOT NULL,
`status` ENUM('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED') NOT NULL DEFAULT 'RECEIVED',
`user_id` CHAR(36) NULL,
`device_id` CHAR(36) NULL,
`agent_session_id` CHAR(36) NULL,
`raw_text` LONGTEXT NULL,
`payload` JSON NULL,
`error_code` VARCHAR(64) NULL,
`error_message` TEXT NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`processed_at` DATETIME(3) NULL,

    INDEX `runtime_events_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `runtime_events_device_id_created_at_idx`(`device_id`, `created_at`),
    INDEX `runtime_events_agent_session_id_created_at_idx`(`agent_session_id`, `created_at`),
    INDEX `runtime_events_source_type_idx`(`source`, `type`),
    INDEX `runtime_events_status_idx`(`status`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `intent_records` (
`id` CHAR(36) NOT NULL,
`runtime_event_id` CHAR(36) NOT NULL,
`domain` ENUM('CHAT', 'ROBOT', 'SYSTEM', 'SKILL', 'UNKNOWN') NOT NULL,
`name` ENUM('CHAT_MESSAGE', 'MOVE', 'TURN', 'STOP', 'FOLLOW_ME', 'DOCK', 'QUERY_STATUS', 'QUERY_BATTERY', 'PLAY_VOICE', 'UNKNOWN') NOT NULL,
`status` ENUM('DETECTED', 'CONFIRMED', 'REJECTED', 'LOW_CONFIDENCE', 'FAILED') NOT NULL DEFAULT 'DETECTED',
`confidence` DECIMAL(5, 4) NULL,
`slots` JSON NULL,
`reason` TEXT NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `intent_records_runtime_event_id_key`(`runtime_event_id`),
    INDEX `intent_records_domain_name_idx`(`domain`, `name`),
    INDEX `intent_records_status_idx`(`status`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `action_records` (
`id` CHAR(36) NOT NULL,
`runtime_event_id` CHAR(36) NOT NULL,
`device_id` CHAR(36) NULL,
`message_id` CHAR(36) NULL,
`domain` ENUM('CHAT', 'ROBOT', 'SYSTEM', 'SKILL', 'VOICE', 'DEVICE') NOT NULL,
`type` ENUM('GENERATE_REPLY', 'GENERATE_VOICE', 'MOVE', 'TURN', 'STOP', 'FOLLOW_ME', 'DOCK', 'QUERY_STATUS', 'QUERY_BATTERY', 'DEVICE_NOTIFY', 'SKILL_EXECUTE') NOT NULL,
`status` ENUM('PENDING', 'DISPATCHED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'TIMEOUT', 'REJECTED') NOT NULL DEFAULT 'PENDING',
`command_payload` JSON NULL,
`result_payload` JSON NULL,
`error_code` VARCHAR(64) NULL,
`error_message` TEXT NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`dispatched_at` DATETIME(3) NULL,
`completed_at` DATETIME(3) NULL,

    INDEX `action_records_runtime_event_id_idx`(`runtime_event_id`),
    INDEX `action_records_device_id_created_at_idx`(`device_id`, `created_at`),
    INDEX `action_records_message_id_idx`(`message_id`),
    INDEX `action_records_domain_type_idx`(`domain`, `type`),
    INDEX `action_records_status_idx`(`status`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usage_records` (
`id` CHAR(36) NOT NULL,
`user_id` CHAR(36) NOT NULL,
`agent_id` CHAR(36) NULL,
`agent_session_id` CHAR(36) NULL,
`runtime_event_id` CHAR(36) NULL,
`model_profile_id` CHAR(36) NULL,
`voice_profile_id` CHAR(36) NULL,
`type` ENUM('LLM_USAGE', 'STT_USAGE', 'TTS_USAGE', 'MANUAL_ADJUSTMENT', 'SYSTEM_GRANT') NOT NULL,
`input_tokens` INTEGER NOT NULL DEFAULT 0,
`output_tokens` INTEGER NOT NULL DEFAULT 0,
`total_tokens` INTEGER NOT NULL DEFAULT 0,
`stt_seconds` DECIMAL(10, 3) NULL,
`tts_characters` INTEGER NOT NULL DEFAULT 0,
`cost_tokens` INTEGER NOT NULL DEFAULT 0,
`raw_cost_cny` DECIMAL(12, 6) NULL,
`billing_multiplier` DECIMAL(4, 2) NULL DEFAULT 1.50,
`pricing_snapshot` JSON NULL,
`metadata` JSON NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `usage_records_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `usage_records_agent_id_created_at_idx`(`agent_id`, `created_at`),
    INDEX `usage_records_agent_session_id_created_at_idx`(`agent_session_id`, `created_at`),
    INDEX `usage_records_runtime_event_id_idx`(`runtime_event_id`),
    INDEX `usage_records_model_profile_id_idx`(`model_profile_id`),
    INDEX `usage_records_voice_profile_id_idx`(`voice_profile_id`),
    INDEX `usage_records_type_created_at_idx`(`type`, `created_at`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recharge_packages` (
`id` CHAR(36) NOT NULL,
`name` VARCHAR(128) NOT NULL,
`amount_rmb` DECIMAL(12, 2) NOT NULL,
`base_tokens` BIGINT NOT NULL,
`agent_tokens` BIGINT NOT NULL,
`bonus_tokens` BIGINT NOT NULL DEFAULT 0,
`discount_percent` DECIMAL(8, 2) NOT NULL DEFAULT 0,
`status` ENUM('ACTIVE', 'PUBLISHED', 'DISABLED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
`sort_order` INTEGER NOT NULL DEFAULT 100,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updated_at` DATETIME(3) NOT NULL,

    INDEX `recharge_packages_status_sort_order_idx`(`status`, `sort_order`),
    INDEX `recharge_packages_amount_rmb_idx`(`amount_rmb`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recharge_orders` (
`id` CHAR(36) NOT NULL,
`order_no` VARCHAR(64) NOT NULL,
`user_id` CHAR(36) NOT NULL,
`amount_rmb` DECIMAL(12, 2) NOT NULL,
`currency` VARCHAR(8) NOT NULL DEFAULT 'CNY',
`agent_tokens` BIGINT NOT NULL,
`status` ENUM('PENDING', 'PAID', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
`payment_provider` ENUM('MOCK', 'WECHAT', 'ALIPAY') NOT NULL DEFAULT 'MOCK',
`payment_method` ENUM('MOCK', 'WECHAT_QR', 'ALIPAY_QR') NOT NULL DEFAULT 'MOCK',
`payment_trade_no` VARCHAR(128) NULL,
`payment_payload` JSON NULL,
`expires_at` DATETIME(3) NOT NULL,
`paid_at` DATETIME(3) NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `recharge_orders_order_no_key`(`order_no`),
    INDEX `recharge_orders_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `recharge_orders_user_id_status_created_at_idx`(`user_id`, `status`, `created_at`),
    INDEX `recharge_orders_status_expires_at_idx`(`status`, `expires_at`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agent_token_transactions` (
`id` CHAR(36) NOT NULL,
`user_id` CHAR(36) NOT NULL,
`type` ENUM('RECHARGE', 'USAGE', 'ADMIN_RECHARGE', 'ADMIN_ADJUST', 'REFUND', 'GIFT') NOT NULL,
`direction` ENUM('CREDIT', 'DEBIT') NOT NULL,
`amount_tokens` BIGINT NOT NULL,
`balance_before` BIGINT NOT NULL,
`balance_after` BIGINT NOT NULL,
`related_order_id` CHAR(36) NULL,
`related_usage_record_id` CHAR(36) NULL,
`operator_admin_id` CHAR(36) NULL,
`description` VARCHAR(255) NULL,
`metadata` JSON NULL,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `agent_token_transactions_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `agent_token_transactions_type_created_at_idx`(`type`, `created_at`),
    INDEX `agent_token_transactions_direction_created_at_idx`(`direction`, `created_at`),
    INDEX `agent_token_transactions_related_order_id_idx`(`related_order_id`),
    INDEX `agent_token_transactions_related_usage_record_id_idx`(`related_usage_record_id`),
    INDEX `agent_token_transactions_operator_admin_id_idx`(`operator_admin_id`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pricing_rules` (
`id` CHAR(36) NOT NULL,
`key` VARCHAR(128) NOT NULL,
`label` VARCHAR(128) NOT NULL,
`group` ENUM('CORE', 'LLM', 'TTS', 'BALANCE', 'VOICE', 'SYSTEM') NOT NULL,
`value_type` ENUM('NUMBER', 'STRING', 'BOOLEAN') NOT NULL,
`value` JSON NOT NULL,
`unit` VARCHAR(64) NULL,
`description` TEXT NULL,
`editable` BOOLEAN NOT NULL DEFAULT true,
`status` ENUM('ACTIVE', 'PUBLISHED', 'DISABLED', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
`sort_order` INTEGER NOT NULL DEFAULT 100,
`created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
`updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pricing_rules_key_key`(`key`),
    INDEX `pricing_rules_group_status_idx`(`group`, `status`),
    INDEX `pricing_rules_sort_order_idx`(`sort_order`),
    PRIMARY KEY (`id`)

) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_current_session_id_fkey` FOREIGN KEY (`current_session_id`) REFERENCES `agent_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `devices` ADD CONSTRAINT `devices_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `model_profiles` ADD CONSTRAINT `model_profiles_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `voice_profiles` ADD CONSTRAINT `voice_profiles_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agents` ADD CONSTRAINT `agents_published_version_id_fkey` FOREIGN KEY (`published_version_id`) REFERENCES `agent_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_versions` ADD CONSTRAINT `agent_versions_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_sessions` ADD CONSTRAINT `agent_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_sessions` ADD CONSTRAINT `agent_sessions_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_agent_session_id_fkey` FOREIGN KEY (`agent_session_id`) REFERENCES `agent_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `runtime_events` ADD CONSTRAINT `runtime_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `runtime_events` ADD CONSTRAINT `runtime_events_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `runtime_events` ADD CONSTRAINT `runtime_events_agent_session_id_fkey` FOREIGN KEY (`agent_session_id`) REFERENCES `agent_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `intent_records` ADD CONSTRAINT `intent_records_runtime_event_id_fkey` FOREIGN KEY (`runtime_event_id`) REFERENCES `runtime_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `action_records` ADD CONSTRAINT `action_records_runtime_event_id_fkey` FOREIGN KEY (`runtime_event_id`) REFERENCES `runtime_events`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `action_records` ADD CONSTRAINT `action_records_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `action_records` ADD CONSTRAINT `action_records_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usage_records` ADD CONSTRAINT `usage_records_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usage_records` ADD CONSTRAINT `usage_records_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usage_records` ADD CONSTRAINT `usage_records_agent_session_id_fkey` FOREIGN KEY (`agent_session_id`) REFERENCES `agent_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usage_records` ADD CONSTRAINT `usage_records_runtime_event_id_fkey` FOREIGN KEY (`runtime_event_id`) REFERENCES `runtime_events`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usage_records` ADD CONSTRAINT `usage_records_model_profile_id_fkey` FOREIGN KEY (`model_profile_id`) REFERENCES `model_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usage_records` ADD CONSTRAINT `usage_records_voice_profile_id_fkey` FOREIGN KEY (`voice_profile_id`) REFERENCES `voice_profiles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recharge_orders` ADD CONSTRAINT `recharge_orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_token_transactions` ADD CONSTRAINT `agent_token_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_token_transactions` ADD CONSTRAINT `agent_token_transactions_related_order_id_fkey` FOREIGN KEY (`related_order_id`) REFERENCES `recharge_orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_token_transactions` ADD CONSTRAINT `agent_token_transactions_related_usage_record_id_fkey` FOREIGN KEY (`related_usage_record_id`) REFERENCES `usage_records`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agent_token_transactions` ADD CONSTRAINT `agent_token_transactions_operator_admin_id_fkey` FOREIGN KEY (`operator_admin_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default pricing rules (matches mock-data.ts templates)
INSERT INTO `pricing_rules` (`id`, `key`, `label`, `group`, `value_type`, `value`, `unit`, `description`, `editable`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
('pricing_rule_agent_tokens_per_rmb', 'agentTokensPerRmb', 'Agent Tokens 兑换比例', 'CORE', 'NUMBER', 1000, 'Agent Tokens / RMB', '平台货币兑换比例。V1 默认 1000 Agent Tokens = 1 RMB。', true, 'ACTIVE', 10, NOW(3), NOW(3)),
('pricing_rule_billing_multiplier', 'billingMultiplier', '计费倍率', 'CORE', 'NUMBER', 1.5, 'x', '用户最终收费 = 原始成本 × 计费倍率。', true, 'ACTIVE', 20, NOW(3), NOW(3)),
('pricing_rule_min_profit', 'minProfitRatio', '最低利润率', 'CORE', 'NUMBER', 1.5, 'x', '售价/成本低于此值即标记为 Loss。', true, 'ACTIVE', 25, NOW(3), NOW(3)),
('pricing_rule_text_min_balance', 'minimumTextBalance', '文字聊天最低余额', 'BALANCE', 'NUMBER', 100, 'Agent Tokens', '文字聊天发起前最低余额门槛。', true, 'ACTIVE', 30, NOW(3), NOW(3)),
('pricing_rule_voice_min_balance', 'minimumVoiceBalance', '语音聊天最低余额', 'BALANCE', 'NUMBER', 1000, 'Agent Tokens', '语音聊天发起前最低余额门槛。', true, 'ACTIVE', 40, NOW(3), NOW(3)),
('pricing_rule_voice_reply_max_chars', 'voiceReplyMaxChars', '语音回复最大字符数', 'VOICE', 'NUMBER', 200, 'chars', '⚠ 暂未启用，预留字段。V2 将用于控制单轮 TTS 最大字符数，避免语音成本失控。', false, 'DISABLED', 50, NOW(3), NOW(3)),
('pricing_rule_text_chat_base', 'textChatBaseTokens', '文字聊天基础收费', 'LLM', 'NUMBER', 1, 'Tokens', '每轮文字聊天基础扣费（总Token ≤ 阶梯阈值时）。', true, 'ACTIVE', 60, NOW(3), NOW(3)),
('pricing_rule_text_chat_tier', 'textChatTierTokens', '文字聊天阶梯阈值', 'LLM', 'NUMBER', 8000, 'Tokens', '每超过此阈值，额外 +textChatExtraCharge Tokens。', true, 'ACTIVE', 61, NOW(3), NOW(3)),
('pricing_rule_text_chat_extra', 'textChatExtraCharge', '文字聊天阶梯加收', 'LLM', 'NUMBER', 1, 'Tokens', '每超过 textChatTierTokens 阈值一次，多加收的 Token 数。', true, 'ACTIVE', 62, NOW(3), NOW(3)),
('pricing_rule_voice_chat_base', 'voiceChatBaseTokens', '语音聊天基础收费', 'VOICE', 'NUMBER', 3, 'Tokens', '每轮语音聊天基础扣费（字符数 ≤ 阶梯阈值时）。', true, 'ACTIVE', 70, NOW(3), NOW(3)),
('pricing_rule_voice_chat_tier', 'voiceChatTierChars', '语音聊天阶梯阈值', 'VOICE', 'NUMBER', 1500, 'Characters', '每超过此阈值，额外 +voiceChatExtraCharge Tokens。', true, 'ACTIVE', 71, NOW(3), NOW(3)),
('pricing_rule_voice_chat_extra', 'voiceChatExtraCharge', '语音聊天阶梯加收', 'VOICE', 'NUMBER', 1, 'Tokens', '每超过 voiceChatTierChars 阈值一次，多加收的 Token 数。', true, 'ACTIVE', 72, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
`label` = VALUES(`label`),
`group` = VALUES(`group`),
`value_type` = VALUES(`value_type`),
`value` = VALUES(`value`),
`unit` = VALUES(`unit`),
`description` = VALUES(`description`),
`editable` = VALUES(`editable`),
`status` = VALUES(`status`),
`sort_order` = VALUES(`sort_order`),
`updated_at` = NOW(3);

-- Seed default recharge packages (1000 Agent Tokens / RMB)
INSERT INTO `recharge_packages` (`id`, `name`, `amount_rmb`, `base_tokens`, `agent_tokens`, `bonus_tokens`, `discount_percent`, `status`, `sort_order`, `created_at`, `updated_at`) VALUES
('pkg_5', '¥5 基础包', 5.00, 5000, 5000, 0, 0, 'ACTIVE', 10, NOW(3), NOW(3)),
('pkg_10', '¥10 标准包', 10.00, 10000, 10000, 0, 0, 'ACTIVE', 20, NOW(3), NOW(3)),
('pkg_30', '¥30 进阶包', 30.00, 30000, 30000, 0, 0, 'ACTIVE', 30, NOW(3), NOW(3)),
('pkg_50', '¥50 高级包', 50.00, 50000, 50000, 0, 0, 'ACTIVE', 40, NOW(3), NOW(3)),
('pkg_100', '¥100 旗舰包', 100.00, 100000, 100000, 0, 0, 'ACTIVE', 50, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE
`name` = VALUES(`name`),
`amount_rmb` = VALUES(`amount_rmb`),
`base_tokens` = VALUES(`base_tokens`),
`agent_tokens` = VALUES(`agent_tokens`),
`bonus_tokens` = VALUES(`bonus_tokens`),
`discount_percent` = VALUES(`discount_percent`),
`status` = VALUES(`status`),
`sort_order` = VALUES(`sort_order`),
`updated_at` = NOW(3);
