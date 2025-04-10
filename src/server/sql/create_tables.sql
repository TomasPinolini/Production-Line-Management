-- Production Core Tables

CREATE TABLE `production_order` (
  `id_PO` int(11) NOT NULL AUTO_INCREMENT,
  `ts_from` timestamp NULL DEFAULT NULL,
  `ts_to` timestamp NULL DEFAULT NULL,
  `materialnummer` varchar(20) DEFAULT NULL,
  `serialnummer` varchar(5) DEFAULT NULL,
  PRIMARY KEY (`id_PO`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `process` (
  `id_P` int(11) NOT NULL AUTO_INCREMENT,
  `id_ProductionOrder` int(11) NOT NULL,
  `ts_from` timestamp NULL DEFAULT NULL,
  `result` char(1) DEFAULT NULL,
  PRIMARY KEY (`id_P`),
  KEY `id_ProductionOrder` (`id_ProductionOrder`),
  CONSTRAINT `process_ibfk_1` FOREIGN KEY (`id_ProductionOrder`) REFERENCES `production_order` (`id_PO`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `process_step` (
  `id_PS` int(11) NOT NULL AUTO_INCREMENT,
  `id_Process` int(11) NOT NULL,
  `ts_from` timestamp NULL DEFAULT NULL,
  `ts_to` timestamp NULL DEFAULT NULL,
  `result` char(1) DEFAULT NULL,
  PRIMARY KEY (`id_PS`),
  KEY `id_Process` (`id_Process`),
  CONSTRAINT `process_step_ibfk_1` FOREIGN KEY (`id_Process`) REFERENCES `process` (`id_P`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `step` (
  `id_S` int(11) NOT NULL AUTO_INCREMENT,
  `id_PS` int(11) NOT NULL,
  `result` char(1) DEFAULT NULL,
  PRIMARY KEY (`id_S`),
  KEY `id_PS` (`id_PS`),
  CONSTRAINT `step_ibfk_1` FOREIGN KEY (`id_PS`) REFERENCES `process_step` (`id_PS`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Flexible Participant System

CREATE TABLE `participant_type` (
  `id_PT` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id_PT`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `participant` (
  `id_Participant` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `id_Type` int(11) NOT NULL,
  PRIMARY KEY (`id_Participant`),
  KEY `id_Type` (`id_Type`),
  CONSTRAINT `participant_ibfk_1` FOREIGN KEY (`id_Type`) REFERENCES `participant_type` (`id_PT`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `variable_attribute` (
  `id_VA` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `id_Type` int(11) NOT NULL,
  `formatData` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id_VA`),
  KEY `id_Type` (`id_Type`),
  CONSTRAINT `variable_attribute_ibfk_1` FOREIGN KEY (`id_Type`) REFERENCES `participant_type` (`id_PT`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `update` (
  `id_U` int(11) NOT NULL AUTO_INCREMENT,
  `id_Participant` int(11) NOT NULL,
  `id_Attribute` int(11) NOT NULL,
  `ts` timestamp NOT NULL DEFAULT current_timestamp(),
  `value` varchar(100) NOT NULL,
  PRIMARY KEY (`id_U`),
  KEY `id_Participant` (`id_Participant`),
  KEY `id_Attribute` (`id_Attribute`),
  CONSTRAINT `update_ibfk_1` FOREIGN KEY (`id_Participant`) REFERENCES `participant` (`id_Participant`) ON DELETE CASCADE,
  CONSTRAINT `update_ibfk_2` FOREIGN KEY (`id_Attribute`) REFERENCES `variable_attribute` (`id_VA`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Linking Participants to Process Steps

CREATE TABLE `step_participant` (
  `id_SP` int(11) NOT NULL AUTO_INCREMENT,
  `id_Step` int(11) NOT NULL,
  `id_Participant` int(11) NOT NULL,
  `result` char(1) DEFAULT NULL,
  PRIMARY KEY (`id_SP`),
  KEY `id_Step` (`id_Step`),
  KEY `id_Participant` (`id_Participant`),
  CONSTRAINT `step_participant_ibfk_1` FOREIGN KEY (`id_Step`) REFERENCES `step` (`id_S`) ON DELETE CASCADE,
  CONSTRAINT `step_participant_ibfk_2` FOREIGN KEY (`id_Participant`) REFERENCES `participant` (`id_Participant`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Optional: Results per Step per Variable

CREATE TABLE `result_details` (
  `id_RD` int(11) NOT NULL AUTO_INCREMENT,
  `id_Step` int(11) NOT NULL,
  `id_UpdateVariable` int(11) NOT NULL,
  PRIMARY KEY (`id_RD`),
  KEY `id_Step` (`id_Step`),
  KEY `id_UpdateVariable` (`id_UpdateVariable`),
  CONSTRAINT `result_details_ibfk_1` FOREIGN KEY (`id_Step`) REFERENCES `step` (`id_S`) ON DELETE CASCADE,
  CONSTRAINT `result_details_ibfk_2` FOREIGN KEY (`id_UpdateVariable`) REFERENCES `update` (`id_U`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci; 