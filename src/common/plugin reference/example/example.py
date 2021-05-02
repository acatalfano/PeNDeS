class PythonPlugin(PluginBase):
    def main(self):
        active_node = self.active_node
        core = self.core
        logger = self.logger
        self.namespace = None
        META = self.META

        # getting the necessary libraries    
        os = self.modules['os']    
        json = self.modules['json']    
        shutil = self.modules['shutil']    
        random = self.modules['random']    
        Template = self.modules['mako.template'].Template        

        logger.info('active node path: ' + core.get_path(active_node))    
        formula_domain = core.get_attribute(active_node, 'formulaDomain')    
        formula_template = Template(core.get_attribute(active_node, 'formulaTemplate'))    
        model_name = core.get_attribute(active_node, 'name')        

        #building structured data from model    
        nodes = core.load_sub_tree(active_node)    
        path2node = {}    
        states = []    
        for node in nodes:      
            path2node[core.get_path(node)] = node      
            if core.is_type_of(node, META['StateBase']):        
                node_data = {'name': core.get_attribute(node, 'name'), 'isInit': False, 'isEnd': False}        
                if core.is_type_of(node, META['Init']):          
                    node_data['isInit'] = True        
                if core.is_type_of(node, META['End']):          
                    node_data['isEnd'] = True        
                states.append(node_data)           

        transitions = []    
        for node in nodes:      
            if core.is_type_of(node, META['Transition']):        
                transitions.append({'src': core.get_attribute(path2node[core.get_pointer_path(node, 'src')], 'name'),          
                                    'dst': core.get_attribute(path2node[core.get_pointer_path(node, 'dst')], 'name')})    

        #now we render the template
        formula_code = formula_template.render(name = model_name,                                           
                                               domain = formula_domain,                                           
                                               states = states,                                           
                                               transitions = transitions)    
        logger.info('\n' + formula_code)    
    
        #go into our formula sub-directory and create a temporary folder
        os.chdir('formula')    
        directory_name = 'form_run_'    
        for i in range(10):      
            directory_name += str(random.randint(0,9))    
        os.mkdir(directory_name)    
        formula_file = open(directory_name + '/test.4ml', 'w+')    
        formula_file.write(formula_code)    
        formula_file.close()        

        #run the formula check    
        os.system('node auto_conform_check.js ' + directory_name + ' StateMachines ' + model_name )    

        #check error    
        if os.path.isfile(directory_name + '/error.txt'):      
            error_file = open(directory_name + '/error.txt', 'r')      
            error_msg = error_file.read()      
            logger.error(error_msg)      
            error_file.close()    

        #check the result    
        result_file = open(directory_name + '/result.txt', 'r')    
        result = result_file.read()    
        result_file.close()        

        #clean up    
        #shutil.rmtree(directory_name)    
        if result.find('true') != -1:  
            logger.info('The model is well-formed!')    
        else:
            logger.info('The model is NOT well-formed!')