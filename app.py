from flask import Flask, render_template, url_for, send_from_directory
 
# Flask constructor takes the name of
# current module (__name__) as argument.
app = Flask(__name__, static_url_path='', static_folder='static')
 
# The route() function of the Flask class is a decorator,
# which tells the application which URL should call
# the associated function.
@app.route('/')
def index():
    # return render_template('index.html')
    # return url_for('static', filename='index.html')
    return send_from_directory('static', 'index.html')
    # return "hola mundor"
 
# main driver function
if __name__ == '__main__':
    app.run()