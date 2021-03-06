logger = require('printit')
    date: true
    prefix: 'app:error'

getTemplateExt = require '../helpers/get_template_ext'
ext = getTemplateExt()

module.exports = (err, req, res, next) ->

    if err instanceof Error
        logger.error err.message
        logger.error err.stack

    statusCode = err.status or 500
    message = if err instanceof Error then err.message else err.error
    message = message or 'Server error occurred' # default message

    if err.headers? and Object.keys(err.headers).length > 0
        res.set header, value for header, value of err.headers

    if err.template? and req?.accepts('html') is 'html'
        templateName = "#{err.template.name}.#{ext}"
        res.render templateName, err.template.params, (err, html) ->
            res.send statusCode, html
    else
        res.send statusCode, error: message
