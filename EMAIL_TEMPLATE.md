# 📧 Шаблон для EmailJS

## Как создать шаблон в EmailJS:

1. Зайдите в свой аккаунт EmailJS
2. Перейдите в раздел **Email Templates**
3. Нажмите **Create New Template**
4. Используйте следующие настройки:

### Template Settings:
- **Template Name**: `Ecoalternativa Lead`
- **Template ID**: `template_ecoalternativa`

### Email Template:

**Subject:**
```
{{subject}}
```

**Content (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #8BC34A; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #8BC34A; }
        .footer { background: #333; color: white; padding: 15px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌿 Новая заявка с сайта Ecoalternativa.ru</h1>
    </div>
    
    <div class="content">
        <div class="info-box">
            <p><strong>⏰ Время:</strong> {{timestamp}}</p>
            <p><strong>📍 Источник:</strong> {{source}}</p>
        </div>
        
        <h3>👤 Контактные данные клиента:</h3>
        <div class="info-box">
            <p><strong>Имя:</strong> {{client_name}}</p>
            <p><strong>Телефон:</strong> {{client_phone}}</p>
            <p><strong>Email:</strong> {{client_email}}</p>
            <p><strong>Объем (тонн):</strong> {{client_volume}}</p>
        </div>
        
        <h3>💬 Сообщение:</h3>
        <div class="info-box">
            <p>{{client_comment}}</p>
        </div>
    </div>
    
    <div class="footer">
        🏭 Экологическая Альтернатива - Shvedoff<br>
        📧 Автоматическое уведомление с сайта ecoalternativa.ru<br>
        📞 +375 (44) 77-33-238 | +7 (499) 923-38-15
    </div>
</body>
</html>
```

**To Email:**
```
{{to_email}}
```

### Переменные шаблона:
- `{{subject}}` - тема письма
- `{{timestamp}}` - время отправки
- `{{source}}` - источник заявки
- `{{client_name}}` - имя клиента
- `{{client_phone}}` - телефон клиента
- `{{client_email}}` - email клиента
- `{{client_volume}}` - объем заказа
- `{{client_comment}}` - комментарий клиента
- `{{to_email}}` - email получателя (progprogect@gmail.com)

## После создания шаблона:

1. Скопируйте **Template ID** 
2. Перейдите в **Account > General**
3. Скопируйте **Public Key**
4. Замените в `form-handler.js`:
   - `templateId: 'template_ecoalternativa'` на ваш Template ID
   - `publicKey: 'YOUR_EMAILJS_PUBLIC_KEY'` на ваш Public Key 