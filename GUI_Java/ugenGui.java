import javax.swing.JFrame;
import javax.swing.JPanel;
import javax.swing.JButton;
import java.awt.Container;
import java.awt.BorderLayout;
import java.awt.event.ActionListener;
import java.awt.event.ActionEvent;

class ugenGui extends JFrame{
    public static void main(String args[]){
	ugenGui frame = new ugenGui("UGEN");
	frame.setVisible(true);
    }

   ugenGui(String title){
	setTitle(title);
	setBounds(100, 100, 100, 100);
	setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
	JPanel p = new JPanel();
	JButton button2 = new JButton("START");
	button2.addActionListener(new ActionListener(){
		public void actionPerformed(ActionEvent event){
		    try{
		    ShellCommandExecuter executer = new ShellCommandExecuter();
		    String result = executer.doExec(new String[]{"ls"});
		    System.out.println(result);
		    }catch(Exception e){
			e.printStackTrace();
		    }

		}
	    });
	p.add(button2);
	
	Container contentPane = getContentPane();
	contentPane.add(p, BorderLayout.CENTER);
    }
}