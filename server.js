/**
 * Простой сервер для отправки email-уведомлений
 * Для работы требует установки: npm install express nodemailer cors
 */

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// Настройка почтового транспорта для ecoalternativa.ru
// ВРЕМЕННО: используем Gmail, так как mailbe07.hoster.by недоступен
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'progprogect@gmail.com',
    pass: 'your-gmail-app-password' // Нужно создать App Password в настройках Google
  }
});

// Проверка подключения к почтовому серверу при запуске
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Ошибка подключения к почтовому серверу:', error);
  } else {
    console.log('✅ Почтовый сервер готов к отправке писем');
  }
});

// API для отправки email
app.post('/api/send-email', async (req, res) => {
  try {
    const { to, subject, message, formData, timestamp, source } = req.body;
    
    console.log('📧 Получен запрос на отправку email:', {
      to: 'progprogect@gmail.com',
      subject,
      source,
      timestamp
    });

    // Отправляем email
    const emailResult = await transporter.sendMail({
      from: '"Экологическая Альтернатива" <info@ecoalternativa.ru>',
      to: 'progprogect@gmail.com',
      subject: subject || 'Новая заявка с сайта ecoalternativa.ru',
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8BC34A; border-bottom: 2px solid #8BC34A; padding-bottom: 10px;">
            🌿 Новая заявка с сайта Ecoalternativa.ru
          </h2>
          
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>⏰ Время:</strong> ${timestamp}</p>
            <p><strong>📍 Источник:</strong> ${source}</p>
          </div>
          
          <h3 style="color: #333;">👤 Контактные данные:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 5px 0;"><strong>Имя:</strong> ${formData?.name || 'Не указано'}</li>
            <li style="padding: 5px 0;"><strong>Телефон:</strong> ${formData?.phone || 'Не указан'}</li>
            <li style="padding: 5px 0;"><strong>Email:</strong> ${formData?.email || 'Не указан'}</li>
            <li style="padding: 5px 0;"><strong>Объем (тонн):</strong> ${formData?.volume || 'Не указан'}</li>
          </ul>
          
          <h3 style="color: #333;">💬 Сообщение:</h3>
          <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; font-style: italic;">
            ${formData?.comment || 'Без комментария'}
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            🏭 Экологическая Альтернатива - Shvedoff<br>
            📧 Автоматическое уведомление с сайта ecoalternativa.ru
          </p>
        </div>
      `
    });

    console.log('✅ Email отправлен успешно на progprogect@gmail.com:', emailResult.messageId);
    
    res.json({ 
      success: true, 
      message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
      messageId: emailResult.messageId 
    });

  } catch (error) {
    console.error('❌ Ошибка отправки email:', error);
    
    res.status(500).json({ 
      success: false, 
      message: 'Ошибка отправки заявки. Попробуйте еще раз или свяжитесь с нами по телефону.',
      error: error.message 
    });
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// API для получения статистики (для разработки)
app.get('/api/stats', (req, res) => {
  res.json({
    server: 'Ecoalternativa Email API',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    emailConfig: {
      host: 'mailbe07.hoster.by',
      from: 'info@ecoalternativa.ru',
      to: 'progprogect@gmail.com'
    }
  });
});

// Middleware для обработки 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint не найден',
    message: 'Доступные endpoints: POST /api/send-email, GET /api/stats' 
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`
🌿 Ecoalternativa Email Server
===============================
🚀 Сервер запущен на порту ${PORT}
🌐 Сайт доступен по адресу: http://localhost:${PORT}
📧 API отправки email: http://localhost:${PORT}/api/send-email
📊 Статистика сервера: http://localhost:${PORT}/api/stats

📮 Настройки почты:
   Почтовый сервер: mailbe07.hoster.by
   Отправитель: info@ecoalternativa.ru
   Получатель: progprogect@gmail.com

📝 Логи будут отображаться здесь...
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Сервер остановлен');
  process.exit(0);
});

module.exports = app; 