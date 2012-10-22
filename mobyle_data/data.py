import unittest
import abc
from abc import ABCMeta
from abc import abstractmethod
from mobyleError import MobyleError


class Data:
    """
    Store and manipulate data. It's composed by two parameters: one data type and one value.
    """

    def __init__( self , data_format = None, value = None):
	'''
	@param data_format: the identifier name of the data format
	@type data_format: DataFormat
	@param value: the value associated to the data
	@type value: not defined specifically. could be anything.
	'''
	if(not isinstance(data_format, DataFormat)):
	    msg = "Programming error! Input data format must be an instance of DataFormat class"
	    raise MobyleError , msg 
        self._data_format = data_format.__class__.__name__
	self._data_type = data_format.get_data_type()
	self._value = value 


    @property
    def data_type(self):
        """
	@return: the data_type of a Data object.
	@rtype: DataType
	"""
        return self._data_type

    @property
    def data_format(self):
        """
	@return: the data_format of a Data object.
	@rtype: DataFormat
	"""
        return self._data_format

    @property
    def value(self):
        """
	@return: the value associated to the dataType.
	@rtype: not defined specifically. could be anything.
	"""
        return self._value


class StructData(Data):

    def __init__( self, input_dict = None):
        self._input_struct = input_dict
	
    def __getitem__( self, key):
        return self._input_struct[key]._data_type


class CollectionData():
    
    def __init__( self, list_of_data = None):
	temp_data_type = list_of_data[0].data_type
	for data in range( len(list_of_data) ):
	    if(list_of_data[data].data_type!=temp_data_type):
		msg = "Programming error! Every entries of the list must have the same data type"
		raise MobyleError , msg 
        self._data_type = temp_data_type

    @property
    def data_type(self):
        """
	@return: the data_type of a Data object.
	@rtype: string
	"""
        return self._data_type


#----------------------
# DATA TYPE MANAGEMENT

class DataType(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def check( self, value ):
	pass
    
    @abstractmethod
    def get_formats( self ):
        pass


class SimpleDataType(DataType):

    def check( self, value ):
	pass
    
    def get_formats( self ):
	return self._data_format.__class__.__name__

    def get_data_type( self ):
	return self.__class__.__name__



class EDAMDataType(DataType):
	
    def __init__( self, EDAM_id = None):
	self._id = EDAM_id
	self._formats = get_formats( )
	
    def check( self, value ):
        return True
    
    def get_formats( self ):
	# results must be read in a database
	return formats["PDB", "mol2"]

class IntegerDataType(SimpleDataType):
	
    def __init__( self ):
	self._data_format = IntegerDataFormat()
	
    def check( self, value ):
        return True

class StringDataType(SimpleDataType):

    def check( self, value ):
        return True
	


#------------------------
# DATA FORMAT MANAGEMENT

class DataFormat(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def convert( self, data ):
	pass
    
    @abstractmethod
    def validate( self, value ):
	pass
    
    @abstractmethod
    def get_data_type( self ):
    	pass
    

class SimpleDataFormat(DataFormat):

    def convert( self, data ):
	pass
    
    def validate( self, value ):
	pass
    
    def get_data_type( self ):
	return self.__class__.__name__


class IntegerDataFormat(SimpleDataFormat):
	
# TODO : est ce que je dois coder une methode convert()
    def convert ( self, data ):
	pass

    def validate( self, value ):
        return True
    
    def get_data_type( self ):
    	return IntegerDataType().__class__.__name__
    
class TextDataFormat(DataFormat):
	
    def convert ( self, data ):
	return Data(TextDataFormat(), data.value)
     
    def validate( self, value ):
        return True
    
    def get_data_type( self ):
    	return StringDataType().__class__.__name__ # return an instance of the specific associated data type not necessarily StringDataType!

class BinaryDataFormat(DataFormat):
		
    def convert ( self, data ):
	return Data(BinaryDataFormat(), data.value)
     
    def validate( self, value ):
        return True
    
    def get_data_type( self ):
    	return 0 # return an instance of the specific associated data type
    
    

    
# UNITARY TESTING

class TestDataType(unittest.TestCase):

    def setUp(self):
	self.type_1 = IntegerDataType()
	self.type_2 = StringDataType()

    def test_check_method(self):
        self.assertTrue(self.type_1.check(4))

    def test_get_formats_method(self):
        self.assertEqual(self.type_1.get_formats(), 'IntegerDataFormat')


class TestDataFormat(unittest.TestCase):

    def setUp(self):
	self.format_1 = BinaryDataFormat()
	self.data_1 = Data(TextDataFormat(), 'file1')
	self.format_2 = IntegerDataFormat()
	
    def test_convert_method(self):
        self.assertEqual(self.format_1.convert(self.data_1).data_format, 'BinaryDataFormat')
	
    def test_validate_method(self):
        self.assertTrue(self.format_2.validate(4))
	
    def test_is_format_of_method(self):
        self.assertEqual(self.format_2.get_data_type(), 'IntegerDataType')
	
	
	
class TestData(unittest.TestCase):

    def setUp(self):
	type_1 = IntegerDataType()
	format_1 = IntegerDataFormat()
	self.nb_of_it = Data(format_1, 3)

    def test_data_type(self):
        self.assertEqual(self.nb_of_it.data_type, 'IntegerDataType')
	self.assertEqual(self.nb_of_it.value, 3)

class TestStructData(unittest.TestCase):

    def setUp(self):
	format_1 = IntegerDataFormat()
	format_2 = TextDataFormat()
	nb_of_it = Data(format_1, 5)
	filename = Data(format_2, 'toto')
	names = ['nb_it', 'file']
	data = [nb_of_it,filename]
	dico = dict(zip(names,data))
	self.structure = StructData(dico)

    def test_value(self):
        self.assertEqual(self.structure['file'], 'StringDataType')


class TestCollectionData(unittest.TestCase):

    def setUp(self):
	data_1 = Data(TextDataFormat(), 'file1')
	data_2 = Data(TextDataFormat(), 'file2')
	data_3 = Data(TextDataFormat(), 'file3')
	list_of_data_1 = [data_1, data_2, data_3]
	self.my_collection_1 = CollectionData(list_of_data_1)

    
    def test_dataType(self):
        self.assertEqual(self.my_collection_1.data_type, 'StringDataType')


	

if __name__=='__main__':
	unittest.main()

