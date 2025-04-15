-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 15, 2025 at 12:29 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `production_line_management_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `asset`
--

CREATE TABLE `asset` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `id_parent` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `attribute_value`
--

CREATE TABLE `attribute_value` (
  `id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `attribute_id` int(11) NOT NULL,
  `value` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `process`
--

CREATE TABLE `process` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `ts_from` timestamp NULL DEFAULT NULL,
  `result` char(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `process_step`
--

CREATE TABLE `process_step` (
  `id` int(11) NOT NULL,
  `process_id` int(11) NOT NULL,
  `ts_from` timestamp NULL DEFAULT NULL,
  `ts_to` timestamp NULL DEFAULT NULL,
  `result` char(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `production_order`
--

CREATE TABLE `production_order` (
  `id` int(11) NOT NULL,
  `material_number` varchar(20) DEFAULT NULL,
  `serial_number` varchar(5) DEFAULT NULL,
  `ts_from` timestamp NULL DEFAULT NULL,
  `ts_to` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `result_detail`
--

CREATE TABLE `result_detail` (
  `id` int(11) NOT NULL,
  `step_id` int(11) NOT NULL,
  `update_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `step`
--

CREATE TABLE `step` (
  `id` int(11) NOT NULL,
  `process_step_id` int(11) NOT NULL,
  `result` char(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `step_asset`
--

CREATE TABLE `step_asset` (
  `id` int(11) NOT NULL,
  `step_id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `result` char(1) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `variable_attribute`
--

CREATE TABLE `variable_attribute` (
  `id` int(11) NOT NULL,
  `asset_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `format_data` varchar(100) DEFAULT NULL,
  `is_reference` BOOLEAN DEFAULT FALSE,
  `is_inherited` BOOLEAN DEFAULT FALSE,
  `inherited_from` int(11) DEFAULT NULL,
  `is_value_inherited` BOOLEAN DEFAULT FALSE,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  FOREIGN KEY (`inherited_from`) REFERENCES `asset` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`asset_id`) REFERENCES `asset` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `asset`
--
ALTER TABLE `asset`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_parent` (`id_parent`);

--
-- Indexes for table `attribute_value`
--
ALTER TABLE `attribute_value`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_id` (`asset_id`),
  ADD KEY `attribute_id` (`attribute_id`);

--
-- Indexes for table `history`
--
ALTER TABLE `history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_id` (`asset_id`),
  ADD KEY `attribute_id` (`attribute_id`);

--
-- Indexes for table `process`
--
ALTER TABLE `process`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`);

--
-- Indexes for table `process_step`
--
ALTER TABLE `process_step`
  ADD PRIMARY KEY (`id`),
  ADD KEY `process_id` (`process_id`);

--
-- Indexes for table `production_order`
--
ALTER TABLE `production_order`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `result_detail`
--
ALTER TABLE `result_detail`
  ADD PRIMARY KEY (`id`),
  ADD KEY `step_id` (`step_id`),
  ADD KEY `update_id` (`update_id`);

--
-- Indexes for table `step`
--
ALTER TABLE `step`
  ADD PRIMARY KEY (`id`),
  ADD KEY `process_step_id` (`process_step_id`);

--
-- Indexes for table `step_asset`
--
ALTER TABLE `step_asset`
  ADD PRIMARY KEY (`id`),
  ADD KEY `step_id` (`step_id`),
  ADD KEY `asset_id` (`asset_id`);

--
-- Indexes for table `variable_attribute`
--
ALTER TABLE `variable_attribute`
  ADD PRIMARY KEY (`id`),
  ADD KEY `asset_id` (`asset_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `asset`
--
ALTER TABLE `asset`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `attribute_value`
--
ALTER TABLE `attribute_value`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `history`
--
ALTER TABLE `history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `process`
--
ALTER TABLE `process`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `process_step`
--
ALTER TABLE `process_step`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `production_order`
--
ALTER TABLE `production_order`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `result_detail`
--
ALTER TABLE `result_detail`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `step`
--
ALTER TABLE `step`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `step_asset`
--
ALTER TABLE `step_asset`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `variable_attribute`
--
ALTER TABLE `variable_attribute`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `asset`
--
ALTER TABLE `asset`
  ADD CONSTRAINT `asset_ibfk_1` FOREIGN KEY (`id_parent`) REFERENCES `asset` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `attribute_value`
--
ALTER TABLE `attribute_value`
  ADD CONSTRAINT `attribute_value_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `asset` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attribute_value_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `variable_attribute` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `history`
--
ALTER TABLE `history`
  ADD CONSTRAINT `history_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `asset` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `history_ibfk_2` FOREIGN KEY (`attribute_id`) REFERENCES `variable_attribute` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `process`
--
ALTER TABLE `process`
  ADD CONSTRAINT `process_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `production_order` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `process_step`
--
ALTER TABLE `process_step`
  ADD CONSTRAINT `process_step_ibfk_1` FOREIGN KEY (`process_id`) REFERENCES `process` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `result_detail`
--
ALTER TABLE `result_detail`
  ADD CONSTRAINT `result_detail_ibfk_1` FOREIGN KEY (`step_id`) REFERENCES `step` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `result_detail_ibfk_2` FOREIGN KEY (`update_id`) REFERENCES `history` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `step`
--
ALTER TABLE `step`
  ADD CONSTRAINT `step_ibfk_1` FOREIGN KEY (`process_step_id`) REFERENCES `process_step` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `step_asset`
--
ALTER TABLE `step_asset`
  ADD CONSTRAINT `step_asset_ibfk_1` FOREIGN KEY (`step_id`) REFERENCES `step` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `step_asset_ibfk_2` FOREIGN KEY (`asset_id`) REFERENCES `asset` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `variable_attribute`
--
ALTER TABLE `variable_attribute`
  ADD CONSTRAINT `variable_attribute_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `asset` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

