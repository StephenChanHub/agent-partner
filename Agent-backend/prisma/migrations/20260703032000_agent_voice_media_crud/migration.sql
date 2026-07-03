-- Enables Studio Agent disable semantics used by the real Agent CRUD service.
-- Media files are stored on disk under Agent-backend/media-storage and referenced by URL in AgentVersion.manifest / VoiceProfile.preview_audio_url.
ALTER TABLE `agents`
  MODIFY `status` ENUM('DRAFT','PUBLISHED','DISABLED','ARCHIVED') NOT NULL DEFAULT 'DRAFT';
